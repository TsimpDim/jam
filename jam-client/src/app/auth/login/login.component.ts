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
    if (this.form.valid) {
      this.loading = true;
      this.loggedIn = false;

      this.authService.login(this.form.value.username, this.form.value.password)
      .subscribe({
        next: (resp: any) => {
          this.loading = false;
          this.loggedIn = 'key' in resp;
          if (this.loggedIn) {
            this.authService.storeSessionToken(resp['key']);
            this.router.navigate(['control-panel/applications']);
          }
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
