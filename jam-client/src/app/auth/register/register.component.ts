import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  public form: FormGroup;
  public loading = false;
  public errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.formBuilder.group(
      {
        username: new FormControl('', [Validators.required]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password1: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
        ]),
        password2: new FormControl('', [
          Validators.required,
          Validators.minLength(8),
        ]),
      },
      { validators: this.checkPasswords }
    );
  }

  ngOnInit(): void {}

  register() {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService
      .register(
        this.form.value.username,
        this.form.value.email,
        this.form.value.password1,
        this.form.value.password2
      )
      .subscribe({
        next: (resp) => {
          this.loading = false;
          if (resp && resp.user) {
            this.authService.setStatusLoggedIn();
            this.router.navigate(['control-panel/applications']);
          }
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = this.parseError(err.error);
        },
      });
  }

  private parseError(error: any): string {
    if (!error) return 'Registration failed. Please check your details.';
    if (error.username) return 'Username: ' + error.username[0];
    if (error.email) return 'Email: ' + error.email[0];
    if (error.password1) return 'Password: ' + error.password1[0];
    if (error.password2) return 'Confirm password: ' + error.password2[0];
    if (error.non_field_errors) return error.non_field_errors[0];
    if (error.detail) return error.detail;
    if (error.error) return error.error;
    return 'Registration failed. Please check your details.';
  }

  checkPasswords: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const pass = group.get('password1')?.value;
    const confirmPass = group.get('password2')?.value;
    return pass === confirmPass ? null : { notSame: true };
  };
}
