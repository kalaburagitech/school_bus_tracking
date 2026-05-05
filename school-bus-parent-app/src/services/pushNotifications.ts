export interface PushNotificationService {
  init(): Promise<void>;
  subscribeToBus(busId: string): Promise<void>;
}

export const pushNotificationService: PushNotificationService = {
  async init() {
    // ready for Expo Notifications integration in next phase
  },
  async subscribeToBus(_busId: string) {
    // tenant + bus scoped subscription hook
  },
};
