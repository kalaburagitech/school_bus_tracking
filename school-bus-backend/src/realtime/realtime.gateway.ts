import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/types/jwt-payload.types';

interface SocketAuthData {
  user?: JwtPayload;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

  /** Used by Kafka consumer (in-process) to push live locations */
  emitBusLocation(
    tenantId: string,
    busId: string,
    payload: Record<string, unknown>,
  ): void {
    if (!this.server) return;
    this.logger.debug(
      `ws_emit event=bus:location tenantId=${tenantId} busId=${busId} tripId=${String(payload.tripId ?? '')} recordedAt=${String(payload.recordedAt ?? '')} source=ws_gateway`,
    );
    this.server.to(this.roomBus(tenantId, busId)).emit('bus:location', payload);
  }

  emitAttendance(
    tenantId: string,
    busId: string,
    payload: Record<string, unknown>,
  ): void {
    if (!this.server) return;
    this.logger.debug(
      `ws_emit event=attendance:update tenantId=${tenantId} busId=${busId} tripId=${String(payload.tripId ?? '')} recordedAt=${String(payload.recordedAt ?? '')} source=ws_gateway`,
    );
    this.server
      .to(this.roomBus(tenantId, busId))
      .emit('attendance:update', payload);
  }

  emitTripStart(
    tenantId: string,
    busId: string,
    payload: { tripId: string; startedAt: string },
  ): void {
    if (!this.server) return;
    this.server.to(this.roomBus(tenantId, busId)).emit('bus:trip_start', { busId, ...payload });
  }

  emitTripEnd(
    tenantId: string,
    busId: string,
    tripId: string,
  ): void {
    if (!this.server) return;
    this.logger.debug(`ws_emit event=bus:trip_end tenantId=${tenantId} busId=${busId} tripId=${tripId}`);
    this.server.to(this.roomBus(tenantId, busId)).emit('bus:trip_end', { busId, tripId });
  }

  private roomBus(tenantId: string, busId: string): string {
    return `tenant:${tenantId}:bus:${busId}`;
  }

  async handleConnection(client: Socket): Promise<void> {
    const token =
      (client.handshake.auth?.token as string | undefined) ||
      (client.handshake.query?.token as string | undefined);
    if (!token) {
      this.logger.warn('WS connection rejected: no token');
      client.disconnect(true);
      return;
    }
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
    } catch {
      client.disconnect(true);
      return;
    }
    (client.data as SocketAuthData).user = payload;
    const tenantId = this.effectiveTenantId(payload);
    if (!tenantId) {
      this.logger.warn('WS: user has no tenant context');
      client.disconnect(true);
      return;
    }
    await client.join(`tenant:${tenantId}:all`);
    this.logger.debug(`WS connected user=${payload.sub} tenant=${tenantId}`);
  }

  @SubscribeMessage('subscribe:bus')
  async subscribeBus(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { busId: string },
  ): Promise<{ ok: boolean; error?: string }> {
    const user = (client.data as SocketAuthData).user;
    if (!user || !body?.busId) {
      return { ok: false, error: 'Unauthorized' };
    }
    const tenantId = this.effectiveTenantId(user);
    if (!tenantId) return { ok: false, error: 'No tenant' };

    const allowed = await this.canSubscribeToBus(user, tenantId, body.busId);
    if (!allowed) {
      return { ok: false, error: 'Forbidden' };
    }

    await client.join(this.roomBus(tenantId, body.busId));
    this.logger.debug(
      `ws_subscribe_ok tenantId=${tenantId} busId=${body.busId} userId=${user.sub} role=${user.role} source=ws_gateway`,
    );
    return { ok: true };
  }

  private effectiveTenantId(user: JwtPayload): string | null {
    if (user.role === 'SUPER_ADMIN') {
      return user.impersonateTenantId ?? null;
    }
    return user.tenantId ?? null;
  }

  private async canSubscribeToBus(
    user: JwtPayload,
    tenantId: string,
    busId: string,
  ): Promise<boolean> {
    if (user.role === 'SCHOOL_ADMIN' || user.role === 'SUPER_ADMIN') {
      const bus = await this.prisma.bus.findFirst({
        where: { id: busId, tenantId },
      });
      return !!bus;
    }
    if (user.role === 'PARENT') {
      const count = await this.prisma.student.count({
        where: {
          tenantId,
          parentUserId: user.sub,
          busId,
        },
      });
      return count > 0;
    }
    if (user.role === 'DRIVER') {
      const bus = await this.prisma.bus.findFirst({
        where: { id: busId, tenantId, driverUserId: user.sub },
      });
      return !!bus;
    }
    return false;
  }
}
