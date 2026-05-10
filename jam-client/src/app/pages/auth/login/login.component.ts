import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { AuthService } from 'src/app/core/services/auth.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, ClarityModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  public form: FormGroup;
  public loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbarService: SnackbarService
  ) {
    this.form = this.formBuilder.group({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(): void {}

  login() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService
      .login(this.form.value.username, this.form.value.password)
      .subscribe({
        next: (resp) => {
          this.loading = false;
          if (resp && resp.user) {
            this.authService.setStatusLoggedIn();
            this.snackbarService.showSuccess('Logged in successfully.');
            this.router.navigate(['applications']);
          }
        },
        error: (err) => {
          this.loading = false;
          this.snackbarService.showError(this.parseError(err.error));
        },
      });
  }

  private parseError(error: any): string {
    if (!error) return 'Login failed.';
    if (error.non_field_errors) return error.non_field_errors[0];
    if (error.username) return 'Username: ' + error.username[0];
    if (error.password) return 'Password: ' + error.password[0];
    if (error.detail) return error.detail;
    if (error.error) return error.error;
    return 'Invalid username or password.';
  }
}
