import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import {
  AbstractControl,
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ClarityModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss', '../../../shared/shared.scss'],
})
export class ResetPasswordComponent implements OnInit {
  public form: FormGroup;
  public loading = false;
  public invalidToken = false;
  public uid = '';
  public token = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackbarService: SnackbarService
  ) {
    this.form = this.formBuilder.group(
      {
        new_password1: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
        ]),
        new_password2: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
        ]),
      },
      { validators: this.checkPasswords }
    );
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.uid = params.get('uid') || '';
      this.token = params.get('token') || '';

      if (!this.uid || !this.token) {
        this.invalidToken = true;
        this.snackbarService.showError(
          'Invalid reset link. Please request a new password reset.'
        );
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService
      .confirmPasswordReset(
        this.uid,
        this.token,
        this.form.value.new_password1,
        this.form.value.new_password2
      )
      .subscribe({
        next: (resp) => {
          this.loading = false;
          this.snackbarService.showSuccess(
            resp?.detail ||
              'Password has been reset successfully. You can now log in.'
          );
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 400) {
            this.invalidToken = true;
          }
          this.snackbarService.showError(this.parseError(err.error));
        },
      });
  }

  private parseError(error: any): string {
    if (!error) return 'Password reset failed. Please try again.';
    if (error.new_password1) return 'New password: ' + error.new_password1[0];
    if (error.new_password2)
      return 'Confirm password: ' + error.new_password2[0];
    if (error.uid)
      return 'Invalid reset link. Please request a new password reset.';
    if (error.token)
      return 'Invalid or expired token. Please request a new password reset.';
    if (error.non_field_errors) return error.non_field_errors[0];
    if (error.detail) return error.detail;
    return 'Password reset failed. Please try again.';
  }

  checkPasswords: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const pass = group.get('new_password1')?.value;
    const confirmPass = group.get('new_password2')?.value;
    return pass === confirmPass ? null : { notSame: true };
  };
}
