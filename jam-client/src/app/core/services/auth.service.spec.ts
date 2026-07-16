import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isLoggedIn', () => {
    it('should return false initially', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should return true after setStatusLoggedIn', () => {
      service.setStatusLoggedIn();
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should return false after clearSession', () => {
      service.setStatusLoggedIn();
      service.clearSession();
      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  describe('isAuthStatusPending', () => {
    it('should return true initially', () => {
      expect(service.isAuthStatusPending()).toBeTrue();
    });

    it('should return false after setting status', () => {
      service.setStatusLoggedIn();
      expect(service.isAuthStatusPending()).toBeFalse();
    });
  });

  describe('loggedIn$', () => {
    it('should emit null initially', (done) => {
      service.loggedIn$.subscribe((val) => {
        expect(val).toBeNull();
        done();
      });
    });

    it('should emit true after setStatusLoggedIn', (done) => {
      service.setStatusLoggedIn();
      service.loggedIn$.subscribe((val) => {
        if (val !== null) {
          expect(val).toBeTrue();
          done();
        }
      });
    });
  });

  describe('checkAuthStatus', () => {
    it('should set logged in on successful /auth/me/ response', async () => {
      const promise = service.checkAuthStatus();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me/`);
      req.flush({ pk: 1, username: 'alice' });
      await promise;
      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should set not logged in on error', async () => {
      const promise = service.checkAuthStatus();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me/`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
      await promise;
      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  describe('login', () => {
    it('should POST to /auth/login/', () => {
      service.login('alice', 'pass').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'alice', password: 'pass' });
    });
  });

  describe('register', () => {
    it('should POST to /auth/register/', () => {
      service.register('alice', 'a@b.com', 'pass1', 'pass2').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        username: 'alice', email: 'a@b.com', password1: 'pass1', password2: 'pass2',
      });
    });
  });

  describe('logout', () => {
    it('should POST to /auth/logout/ and clear session', async () => {
      service.setStatusLoggedIn();
      const promise = service.logout();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout/`);
      req.flush({});
      await promise;
      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  describe('password reset', () => {
    it('requestPasswordReset should POST', () => {
      service.requestPasswordReset('a@b.com').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/password-reset/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'a@b.com' });
    });

    it('confirmPasswordReset should POST', () => {
      service.confirmPasswordReset('uid', 'token', 'pass1', 'pass2').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/password-reset/confirm/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        uid: 'uid', token: 'token', new_password1: 'pass1', new_password2: 'pass2',
      });
    });
  });
});
