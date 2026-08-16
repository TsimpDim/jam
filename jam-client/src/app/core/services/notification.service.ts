import { Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { JamService } from '../api/jam.service';
import { AppNotification } from '../../interfaces';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<AppNotification[]>([]);
  readonly loading = signal<boolean>(false);
  readonly unreadOnly = signal<boolean>(false);

  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.is_read).length,
  );

  readonly filteredNotifications = computed(() => {
    const all = this.notifications();
    if (this.unreadOnly()) {
      return all.filter((n) => !n.is_read);
    }
    return all;
  });

  private pollingTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private jamService: JamService) {}

  startPolling(): void {
    if (this.pollingTimer) return;
    this.pollingTimer = setInterval(() => this.fetchNotifications(), 60000);
  }

  stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  async fetchNotifications(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await firstValueFrom(this.jamService.getNotifications());
      this.notifications.set(data);
    } catch {
      // Handled by component
    } finally {
      this.loading.set(false);
    }
  }

  async markAsRead(id: number): Promise<void> {
    const previous = this.notifications();
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    try {
      await firstValueFrom(this.jamService.markNotificationRead(id));
    } catch {
      this.notifications.set(previous);
    }
  }

  toggleUnreadOnly(): void {
    this.unreadOnly.update((v) => !v);
  }
}
