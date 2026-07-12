import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationService } from '../../core/services/notification.service';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    notificationServiceSpy = jasmine.createSpyObj(
      'NotificationService',
      ['startPolling', 'stopPolling', 'fetchNotifications', 'markAsRead', 'toggleNewOnly'],
      {
        notifications: signal([]),
        loading: signal(false),
        newOnly: signal(false),
        unreadCount: signal(0),
        filteredNotifications: signal([]),
      },
    );

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [
        provideNoopAnimations(),
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should start polling on init', () => {
      expect(notificationServiceSpy.startPolling).toHaveBeenCalled();
      expect(notificationServiceSpy.fetchNotifications).toHaveBeenCalled();
    });

    it('should stop polling on destroy', () => {
      component.ngOnDestroy();
      expect(notificationServiceSpy.stopPolling).toHaveBeenCalled();
    });
  });

  describe('toggle', () => {
    it('should open and fetch fresh notifications', () => {
      component.toggle();
      expect(component.isOpen()).toBeTrue();
      expect(notificationServiceSpy.fetchNotifications).toHaveBeenCalledTimes(2);
    });

    it('should close', () => {
      component.toggle();
      component.toggle();
      expect(component.isOpen()).toBeFalse();
    });
  });

  describe('close', () => {
    it('should set isOpen to false', () => {
      component.toggle();
      component.close();
      expect(component.isOpen()).toBeFalse();
    });
  });

  describe('onNotificationClick', () => {
    it('should mark as read if unread', () => {
      const notification = { id: 5, is_read: false } as any;
      component.onNotificationClick(notification);
      expect(notificationServiceSpy.markAsRead).toHaveBeenCalledWith(5);
    });

    it('should not mark as read if already read', () => {
      const notification = { id: 5, is_read: true } as any;
      component.onNotificationClick(notification);
      expect(notificationServiceSpy.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe('toggleNewOnly', () => {
    it('should delegate to service', () => {
      component.toggleNewOnly();
      expect(notificationServiceSpy.toggleNewOnly).toHaveBeenCalled();
    });
  });

  describe('statusIcon', () => {
    it('should return correct icon for each status', () => {
      expect(component.statusIcon('success')).toBe('check-circle');
      expect(component.statusIcon('error')).toBe('exclamation-circle');
      expect(component.statusIcon('warning')).toBe('exclamation-triangle');
      expect(component.statusIcon('info')).toBe('info-standard');
    });

    it('should default to info-standard for unknown status', () => {
      expect(component.statusIcon('unknown')).toBe('info-standard');
    });
  });

  describe('keyboard events', () => {
    it('should close on escape when open', () => {
      component.toggle();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.onEscapeKey(event);
      expect(component.isOpen()).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not close on escape when already closed', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.onEscapeKey(event);
      expect(component.isOpen()).toBeFalse();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
