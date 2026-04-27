import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss', '../../shared/shared.scss'],
})
export class ForgotPasswordComponent implements OnInit {
  public form: FormGroup;
  public loading = false;
  public errorMessage = '';
  public successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.formBuilder.group({
      email: new FormControl('', [Validators.required, Validators.email]),
    });
  }

  ngOnInit(): void {}

  submit() {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService.requestPasswordReset(this.form.value.email).subscribe({
      next: (resp) => {
        this.loading = false;
        this.successMessage =
          resp?.detail ||
          'If an account with that email exists, a password reset link has been sent.';
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.parseError(err.error);
      },
    });
  }

  private parseError(error: any): string {
    if (!error) return 'Request failed. Please try again.';
    if (error.email) return 'Email: ' + error.email[0];
    if (error.detail) return error.detail;
    if (error.non_field_errors) return error.non_field_errors[0];
    return 'Request failed. Please try again.';
  }
}
