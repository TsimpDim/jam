import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): UrlTree | boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }
    return this.router.parseUrl('/auth/login');
  }
}

@Injectable({
  providedIn: 'root',
})
export class NoAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): UrlTree | boolean {
    if (!this.authService.isLoggedIn()) {
      return true;
    }
    return this.router.parseUrl('/control-panel/applications');
  }
}
