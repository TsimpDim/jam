import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit{
  public form: FormGroup;
  public loading: Boolean = false;
  public loggedIn: Boolean | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
    ) {
    this.form = this.formBuilder.group({
      username: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });
  }

  ngOnInit(): void { }

  login() {
    if (this.form.valid) {
      this.loading = true;
      this.loggedIn = false;

      this.authService.login(this.form.value.username, this.form.value.password)
      .subscribe({
        next: (resp) => {
          this.loading = false;
          this.loggedIn = 'key' in resp;
        },
        error: (err) => {
          this.loading = false;
          this.loggedIn = false;
        },
        complete: () => this.loading = false
      });
    }
  }
}
