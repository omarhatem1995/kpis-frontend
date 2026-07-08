import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FcmService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/member/fcmToken`;

  private readonly app = initializeApp(environment.firebase);
  private readonly messaging = getMessaging(this.app);

  async requestPermissionAndRegister(): Promise<void> {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const token = await getToken(this.messaging, { vapidKey: environment.firebase.vapidKey });
      if (!token) return;

      this.http.post(this.base, { token }).subscribe();

      onMessage(this.messaging, payload => {
        const { title, body } = payload.notification ?? {};
        if (title) new Notification(title, { body: body ?? '' });
      });
    } catch (err) {
      console.warn('FCM registration failed:', err);
    }
  }

  unregister(token: string): void {
    this.http.delete(this.base, { body: { token } }).subscribe();
  }
}
