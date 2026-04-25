import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

declare const chrome: any;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  errorMessage = '';
  loading = false;

  private registrationListener: (message: any) => void;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });

    // Listen for registration complete message from background script
    this.registrationListener = (message: any) => {
      if (message.action === 'registrationComplete') {
        this.onRegistrationComplete();
      }
    };
  }

  ngOnInit(): void {
    chrome.runtime.onMessage.addListener(this.registrationListener);
  }

  ngOnDestroy(): void {
    chrome.runtime.onMessage.removeListener(this.registrationListener);
    chrome.runtime.sendMessage({ action: 'stopRegistrationListener' });
  }

  async onSubmit(): Promise<void> {
    const { username, password } = this.loginForm.value;

    if (!username || !password) {
      this.errorMessage = 'Please enter both username and password';
      return;
    }

    this.errorMessage = '';
    this.loading = true;

    try {
      await this.authService.login(username, password);
      this.loginForm.reset();
      this.router.navigate(['/add-app']);
    } catch (error: any) {
      this.errorMessage = error.message || 'Login failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  onRegisterClick(event: Event): void {
    event.preventDefault();
    // Start listening for registration completion
    chrome.runtime.sendMessage({ action: 'startRegistrationListener' });
    window.open(`${environment.clientUrl}/auth/register`, '_blank');
  }

  private async onRegistrationComplete(): Promise<void> {
    // Registration completed in web tab, prompt user to login
    this.errorMessage =
      'Registration successful! Please login with your new account.';
  }

  onPasswordKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSubmit();
    }
  }
}
