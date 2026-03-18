import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';


interface IAuth {
  key: string
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss', '../../shared/shared.scss']
})
export class LoginComponent implements OnInit{
  public form: FormGroup;
  public loading: Boolean = false;
  public loggedIn: Boolean | null = null;
  public errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
    ) {
    this.form = this.formBuilder.group({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(): void { }

  login() {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.valid) {
      this.loading = true;
      this.loggedIn = false;

      this.authService.login(this.form.value.username, this.form.value.password)
      .subscribe({
        next: (resp: any) => {
          this.loading = false;
          // check if key is in resp
          if ('key' in resp) {
            this.loggedIn = true;
            this.authService.storeSessionToken(resp['key']);
            this.router.navigate(['control-panel/applications']);
          } else {
            this.loggedIn = false;
            this.errorMessage = 'Login failed.';
          }
        },
        error: (err) => {
          this.loading = false;
          this.loggedIn = false;
          this.errorMessage = 'Invalid username or password.';
          if (err.error && err.error.non_field_errors) {
            this.errorMessage = err.error.non_field_errors[0];
          } else if (err.error && err.error.detail) {
            this.errorMessage = err.error.detail;
          }
        },
        complete: () => this.loading = false
      });
    }
  }
}
