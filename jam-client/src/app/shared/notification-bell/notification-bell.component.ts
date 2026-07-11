import { Component, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { AppNotification } from '../../interfaces';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  readonly isOpen = signal<boolean>(false);

  constructor(public notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.startPolling();
    this.notificationService.fetchNotifications();
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  toggle(): void {
    const open = !this.isOpen();
    this.isOpen.set(open);
    if (open) {
      this.notificationService.fetchNotifications();
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  onNotificationClick(notification: AppNotification): void {
    if (!notification.is_read) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  toggleNewOnly(): void {
    this.notificationService.toggleNewOnly();
  }

  statusIcon(status: string): string {
    const map: Record<string, string> = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-standard',
    };
    return map[status] || 'info-standard';
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isOpen()) {
      event.preventDefault();
      this.close();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const bell = document.querySelector('.notification-bell-wrapper');
    if (bell && !bell.contains(target)) {
      this.close();
    }
  }
}
