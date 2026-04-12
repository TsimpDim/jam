import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
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
    window.open(`${environment.clientUrl}/auth/register`, '_blank');
  }

  onPasswordKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSubmit();
    }
  }
}
