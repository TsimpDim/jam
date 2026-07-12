import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register', 'setStatusLoggedIn']);
    authServiceSpy.register.and.returnValue(of({ user: { pk: 1, username: 'alice' } }));

    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validators', () => {
    it('should require username', () => {
      const username = component.form.get('username');
      username?.setValue('');
      expect(username?.valid).toBeFalse();
      username?.setValue('alice');
      expect(username?.valid).toBeTrue();
    });

    it('should require valid email', () => {
      const email = component.form.get('email');
      email?.setValue('');
      expect(email?.valid).toBeFalse();
      email?.setValue('invalid');
      expect(email?.valid).toBeFalse();
      email?.setValue('alice@example.com');
      expect(email?.valid).toBeTrue();
    });

    it('should require min length 8 for password1', () => {
      const pw1 = component.form.get('password1');
      pw1?.setValue('short');
      expect(pw1?.valid).toBeFalse();
      pw1?.setValue('longenough123');
      expect(pw1?.valid).toBeTrue();
    });

    it('should require min length 8 for password2', () => {
      const pw2 = component.form.get('password2');
      pw2?.setValue('short');
      expect(pw2?.valid).toBeFalse();
      pw2?.setValue('longenough123');
      expect(pw2?.valid).toBeTrue();
    });
  });

  describe('checkPasswords validator', () => {
    it('should return null when passwords match', () => {
      component.form.patchValue({ password1: 'password123', password2: 'password123' });
      expect(component.checkPasswords(component.form)).toBeNull();
    });

    it('should return notSame when passwords do not match', () => {
      component.form.patchValue({ password1: 'password123', password2: 'different456' });
      expect(component.checkPasswords(component.form)?.['notSame']).toBeTrue();
    });
  });

  describe('register', () => {
    it('should not submit invalid form', () => {
      component.form.patchValue({ username: '', email: 'a@b.com', password1: 'pass1234', password2: 'pass1234' });
      component.register();
      expect(authServiceSpy.register).not.toHaveBeenCalled();
    });

    it('should call authService.register on valid form', () => {
      component.form.patchValue({
        username: 'alice', email: 'alice@example.com',
        password1: 'password123', password2: 'password123',
      });
      component.register();
      expect(authServiceSpy.register).toHaveBeenCalledWith(
        'alice', 'alice@example.com', 'password123', 'password123',
      );
    });

    it('should set logged in on success', () => {
      component.form.patchValue({
        username: 'alice', email: 'alice@example.com',
        password1: 'password123', password2: 'password123',
      });
      component.register();
      expect(authServiceSpy.setStatusLoggedIn).toHaveBeenCalled();
    });

    it('should show success snackbar on success', () => {
      component.form.patchValue({
        username: 'alice', email: 'alice@example.com',
        password1: 'password123', password2: 'password123',
      });
      component.register();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    });

    it('should show error snackbar on failure', () => {
      authServiceSpy.register.and.returnValue(throwError(() => ({ error: { username: ['Taken'] } })));
      component.form.patchValue({
        username: 'alice', email: 'alice@example.com',
        password1: 'password123', password2: 'password123',
      });
      component.register();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });
});
