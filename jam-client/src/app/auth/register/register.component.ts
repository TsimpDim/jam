import { Component, OnInit } from '@angular/core';
import { fakeAsync } from '@angular/core/testing';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  public form: FormGroup;
  public registered: Boolean | null = null;  
  public loading: Boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
    ) {
    this.form = this.formBuilder.group({
      username: new FormControl('', [Validators.required]),
      password1: new FormControl('', [Validators.required, Validators.minLength(8)]),
      password2: new FormControl('', [Validators.required, Validators.minLength(8)]),
    }, { validators: this.checkPasswords});
  }

  ngOnInit(): void {}

  register() {
    if (this.form.valid) {
      this.loading = true;

      this.authService.register(
        this.form.value.username, this.form.value.password1, this.form.value.password2
      ).subscribe({
        next: (resp) => {
          this.registered = 'key' in resp;
          if (this.registered) {
            this.router.navigate(['/auth/login']);
          }
        },
        error: (err) => {
          this.registered = false;
        },
        complete: () => this.loading = false
      })


      this.loading = false;
    }
  }

  checkPasswords: ValidatorFn = (group: AbstractControl):  ValidationErrors | null => { 
    let pass = group.get('password1')?.value;
    let confirmPass = group.get('password2')?.value
    return pass === confirmPass ? null : { notSame: true }
  }
}

