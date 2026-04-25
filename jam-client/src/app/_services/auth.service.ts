import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AuthUserResponse {
  pk: number;
  username: string;
}

export interface AuthTokenResponse {
  user: AuthUserResponse;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private statusLoggedIn = new BehaviorSubject<boolean | null>(null);
  loggedIn$ = this.statusLoggedIn.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  async checkAuthStatus(): Promise<void> {
    const user = await firstValueFrom(
      this.http
        .get<AuthUserResponse>(environment.apiUrl + '/auth/me/')
        .pipe(catchError(() => of(null)))
    );
    this.statusLoggedIn.next(user !== null);
  }

  login(username: string, password: string): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(
      environment.apiUrl + '/auth/login/',
      { username, password }
    );
  }

  register(
    username: string,
    password1: string,
    password2: string
  ): Observable<AuthTokenResponse> {
    return this.http.post<AuthTokenResponse>(
      environment.apiUrl + '/auth/register/',
      { username, password1, password2 }
    );
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(environment.apiUrl + '/auth/logout/', {})
      );
    } catch {
      // Catch error but continue with clearing session
    }
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  setStatusLoggedIn(): void {
    this.statusLoggedIn.next(true);
  }

  isLoggedIn(): boolean {
    return !!this.statusLoggedIn.value;
  }

  isAuthStatusPending(): boolean {
    return this.statusLoggedIn.value === null;
  }

  clearSession(): void {
    this.statusLoggedIn.next(false);
  }
}
