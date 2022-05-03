import { Injectable } from '@angular/core';
import { CanActivate, CanDeactivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor(
    public authService: AuthService,
    public router: Router
  ) { }

  canActivate(): boolean {
    if (!this.authService.getSessionToken()) {
      this.router.navigate(['auth/login']);
      return false;
    }
    return true;
  }
}
