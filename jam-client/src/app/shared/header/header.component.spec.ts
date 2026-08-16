import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { provideRouter } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  function createMockAuth(): AuthService {
    return {
      loggedIn$: of(true),
      isLoggedIn: () => true,
      isAuthStatusPending: () => false,
      logout: jasmine.createSpy('logout'),
      setStatusLoggedIn: jasmine.createSpy('setStatusLoggedIn'),
      clearSession: jasmine.createSpy('clearSession'),
      checkAuthStatus: jasmine.createSpy('checkAuthStatus'),
      login: jasmine.createSpy('login'),
      register: jasmine.createSpy('register'),
      requestPasswordReset: jasmine.createSpy('requestPasswordReset'),
      confirmPasswordReset: jasmine.createSpy('confirmPasswordReset'),
    } as unknown as AuthService;
  }

  function createMockTheme(): ThemeService {
    return {
      theme: signal('light'),
      isDark: () => false,
      toggle: jasmine.createSpy('toggle'),
    } as unknown as ThemeService;
  }

  function createMockNotification(): NotificationService {
    return {
      notifications: signal([]),
      loading: signal(false),
      unreadOnly: signal(false),
      unreadCount: signal(0),
      filteredNotifications: signal([]),
      startPolling: jasmine.createSpy('startPolling'),
      stopPolling: jasmine.createSpy('stopPolling'),
      fetchNotifications: jasmine.createSpy('fetchNotifications'),
      markAsRead: jasmine.createSpy('markAsRead'),
      toggleUnreadOnly: jasmine.createSpy('toggleUnreadOnly'),
    } as unknown as NotificationService;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        provideRouter([
          { path: 'auth/login', component: {} as any },
          { path: 'auth/register', component: {} as any },
          { path: 'applications', component: {} as any },
          { path: 'steps', component: {} as any },
          { path: 'leads', component: {} as any },
          { path: 'cv', component: {} as any },
          { path: 'analytics', component: {} as any },
        ]),
        { provide: AuthService, useFactory: createMockAuth },
        { provide: ThemeService, useFactory: createMockTheme },
        { provide: NotificationService, useFactory: createMockNotification },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('mobile menu', () => {
    it('should start closed', () => {
      expect(component.mobileMenuOpen).toBeFalse();
    });

    it('should toggle open/close', () => {
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen).toBeTrue();
      component.toggleMobileMenu();
      expect(component.mobileMenuOpen).toBeFalse();
    });

    it('should close when closeMobileMenu is called', () => {
      component.mobileMenuOpen = true;
      component.closeMobileMenu();
      expect(component.mobileMenuOpen).toBeFalse();
    });

    it('should render mobile menu toggle button when logged in', () => {
      const buttons = fixture.nativeElement.querySelectorAll(
        '.mobile-menu-toggle',
      );
      expect(buttons.length).toBe(1);
    });
  });

  describe('authentication visibility', () => {
    it('should show notification bell and logout when logged in', () => {
      fixture.detectChanges();
      const logoutBtn = fixture.nativeElement.querySelector(
        '[aria-label="Logout"]',
      );
      expect(logoutBtn).toBeTruthy();
    });

    it('should show login/register links when logged out', () => {
      const auth = TestBed.inject(AuthService) as any;
      auth.isLoggedIn = () => false;
      component.isLoggedIn = false;
      fixture.detectChanges();
      const links = fixture.nativeElement.querySelectorAll(
        '.header-actions .nav-link',
      );
      expect(links.length).toBe(2);
    });
  });

  describe('theme toggle', () => {
    it('should call themeService.toggle on theme button click', () => {
      const themeService = TestBed.inject(ThemeService);
      const themeBtn = fixture.nativeElement.querySelector('.theme-toggle');
      themeBtn.click();
      expect(themeService.toggle).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call authService.logout', () => {
      const authService = TestBed.inject(AuthService);
      component.logout();
      expect(authService.logout).toHaveBeenCalled();
    });
  });
});
