export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  kafka: {
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    clientId: process.env.KAFKA_CLIENT_ID ?? 'school-bus-backend',
    groupId: process.env.KAFKA_GROUP_ID ?? 'school-bus-tracking-consumer',
    trackingTopic: process.env.KAFKA_TRACKING_TOPIC ?? 'tracking.events',
    disabled:
      process.env.KAFKA_DISABLED === '1' ||
      process.env.KAFKA_DISABLED === 'true',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    /** Seconds (avoids ms StringValue typing issues in @nestjs/jwt) */
    accessExpiresSec: parseInt(process.env.JWT_ACCESS_EXPIRES_SEC ?? '900', 10),
    refreshExpiresSec: parseInt(
      process.env.JWT_REFRESH_EXPIRES_SEC ?? String(60 * 60 * 24 * 7),
      10,
    ),
  },
  otp: {
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? '300', 10),
    devCode: process.env.OTP_DEV_CODE ?? '',
  },
});
