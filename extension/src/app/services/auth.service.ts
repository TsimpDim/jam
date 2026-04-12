import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'authToken';

  private authKeySubject = new BehaviorSubject<string | null>(null);
  public authToken$ = this.authKeySubject.asObservable();

  constructor() {
    this.checkLoginStatus();
  }

  checkLoginStatus() {
    const authKey = localStorage.getItem(this.TOKEN_KEY);
    if (authKey) {
      this.authKeySubject.next(authKey);
      return true;
    }

    this.authKeySubject.next(null);
    return false;
  }

  login(username: string, password: string) {
    fetch(`${environment.apiUrl}/ext/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        response.json().then((json) => {
          const authKey = json.key;

          if (!authKey) {
            throw new Error('No token received from server.');
          }

          localStorage.setItem(this.TOKEN_KEY, authKey);

          this.authKeySubject.next(authKey);
        });
      })
      .catch((error) => {
        throw new Error(
          error.detail || 'Login failed. Please check your credentials.'
        );
      });
  }

  logout() {
    const authKey = this.authKeySubject.value;
    if (authKey) {
      fetch(`${environment.apiUrl}/ext/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${authKey}`,
        },
      });
    }

    localStorage.removeItem(this.TOKEN_KEY);
    this.authKeySubject.next(null);
  }

  getAuthKey(): string | null {
    return this.authKeySubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.authKeySubject.value;
  }
}
