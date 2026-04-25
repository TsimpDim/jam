import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const headers: Record<string, string> = {};

    // SessionAuthentication enforces CSRF on mutating requests only.
    // Django sets a readable csrftoken cookie; inject it as X-CSRFToken.
    const CSRF_SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];
    const csrfToken = this.getCookie('csrftoken');
    if (csrfToken && !CSRF_SAFE_METHODS.includes(req.method.toUpperCase())) {
      headers['X-CSRFToken'] = csrfToken;
    }

    const clonedRequest = req.clone({
      withCredentials: true,
      setHeaders: headers,
    });

    return next.handle(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.clearSession();
          this.router.navigate(['/auth/login']);
        }
        return throwError(() => error);
      })
    );
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(
      new RegExp('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')
    );
    return match ? match[2] : null;
  }
}
