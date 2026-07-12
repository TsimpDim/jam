import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with empty notifications', () => {
      expect(service.notifications()).toEqual([]);
    });

    it('should start with loading false', () => {
      expect(service.loading()).toBeFalse();
    });

    it('should start with newOnly false', () => {
      expect(service.newOnly()).toBeFalse();
    });

    it('should start with unreadCount 0', () => {
      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('fetchNotifications', () => {
    it('should fetch notifications and set them', async () => {
      const mockData = [
        { id: 1, text: 'Test', is_read: false, notification_type: 'test', status: 'info', created_at: '2024-01-01' },
      ];
      const promise = service.fetchNotifications();
      const req = httpMock.expectOne(`${environment.apiUrl}/jam/notifications/`);
      req.flush(mockData);
      await promise;
      expect(service.notifications().length).toBe(1);
      expect(service.notifications()[0].text).toBe('Test');
      expect(service.loading()).toBeFalse();
    });

    it('should set loading during fetch', () => {
      const promise = service.fetchNotifications();
      expect(service.loading()).toBeTrue();
      const req = httpMock.expectOne(`${environment.apiUrl}/jam/notifications/`);
      req.flush([]);
    });
  });

  describe('markAsRead', () => {
    it('should optimistically update notification', async () => {
      service.notifications.set([
        { id: 1, text: 'Unread', is_read: false, notification_type: 'test', status: 'info', created_at: '2024-01-01' },
      ]);
      const promise = service.markAsRead(1);
      expect(service.notifications()[0].is_read).toBeTrue();
      const req = httpMock.expectOne(`${environment.apiUrl}/jam/notifications/1/mark-read/`);
      req.flush({ status: 'ok' });
      await promise;
      expect(service.notifications()[0].is_read).toBeTrue();
    });

    it('should rollback on error', async () => {
      service.notifications.set([
        { id: 1, text: 'Unread', is_read: false, notification_type: 'test', status: 'info', created_at: '2024-01-01' },
      ]);
      const promise = service.markAsRead(1);
      const req = httpMock.expectOne(`${environment.apiUrl}/jam/notifications/1/mark-read/`);
      req.flush({}, { status: 500, statusText: 'Error' });
      await promise;
      expect(service.notifications()[0].is_read).toBeFalse();
    });
  });

  describe('unreadCount', () => {
    it('should count unread notifications', () => {
      service.notifications.set([
        { id: 1, text: 'A', is_read: false, notification_type: 'test', status: 'info', created_at: '' },
        { id: 2, text: 'B', is_read: true, notification_type: 'test', status: 'info', created_at: '' },
        { id: 3, text: 'C', is_read: false, notification_type: 'test', status: 'info', created_at: '' },
      ]);
      expect(service.unreadCount()).toBe(2);
    });
  });

  describe('filteredNotifications', () => {
    it('should return all when newOnly is false', () => {
      service.notifications.set([
        { id: 1, text: 'A', is_read: false, notification_type: 'test', status: 'info', created_at: '' },
        { id: 2, text: 'B', is_read: true, notification_type: 'test', status: 'info', created_at: '' },
      ]);
      expect(service.filteredNotifications().length).toBe(2);
    });

    it('should return only unread when newOnly is true', () => {
      service.newOnly.set(true);
      service.notifications.set([
        { id: 1, text: 'A', is_read: false, notification_type: 'test', status: 'info', created_at: '' },
        { id: 2, text: 'B', is_read: true, notification_type: 'test', status: 'info', created_at: '' },
      ]);
      expect(service.filteredNotifications().length).toBe(1);
      expect(service.filteredNotifications()[0].id).toBe(1);
    });
  });

  describe('toggleNewOnly', () => {
    it('should toggle newOnly', () => {
      expect(service.newOnly()).toBeFalse();
      service.toggleNewOnly();
      expect(service.newOnly()).toBeTrue();
      service.toggleNewOnly();
      expect(service.newOnly()).toBeFalse();
    });
  });

  describe('polling', () => {
    beforeEach(() => {
      jasmine.clock().uninstall();
      jasmine.clock().install();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should start polling interval', () => {
      spyOn(service, 'fetchNotifications');
      service.startPolling();
      jasmine.clock().tick(60001);
      expect(service.fetchNotifications).toHaveBeenCalled();
    });

    it('should stop polling', () => {
      spyOn(service, 'fetchNotifications');
      service.startPolling();
      service.stopPolling();
      jasmine.clock().tick(60001);
      expect(service.fetchNotifications).not.toHaveBeenCalledTimes(2);
    });

    it('should not start duplicate polling', () => {
      spyOn(service, 'fetchNotifications');
      service.startPolling();
      service.startPolling();
      jasmine.clock().tick(60001);
      expect(service.fetchNotifications).toHaveBeenCalledTimes(1);
    });
  });
});
