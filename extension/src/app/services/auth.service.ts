import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

declare const chrome: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'authToken';
  private readonly USERNAME_KEY = 'username';

  private authTokenSubject = new BehaviorSubject<string | null>(null);
  public authToken$ = this.authTokenSubject.asObservable();

  constructor() {
    this.checkLoginStatus();
  }

  async checkLoginStatus(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get([this.TOKEN_KEY, this.USERNAME_KEY]);
      if (result[this.TOKEN_KEY]) {
        this.authTokenSubject.next(result[this.TOKEN_KEY]);
        return true;
      }
      this.authTokenSubject.next(null);
      return false;
    } catch (error) {
      this.authTokenSubject.next(null);
      return false;
    }
  }

  async login(username: string, password: string): Promise<{ key: string }> {
    const response = await fetch(`${environment.apiUrl}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Login failed. Please check your credentials.');
    }

    const data = await response.json();
    const token = data.key || data.token;

    if (!token) {
      throw new Error('No token received from server.');
    }

    await chrome.storage.local.set({
      authToken: token,
      username: username
    });

    this.authTokenSubject.next(token);
    return { key: token };
  }

  async logout(): Promise<void> {
    const token = this.authTokenSubject.value;
    if (token) {
      try {
        await fetch(`${environment.apiUrl}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`
          }
        });
      } catch (e) {}
    }

    try {
      await chrome.storage.local.remove([this.TOKEN_KEY, this.USERNAME_KEY]);
      this.authTokenSubject.next(null);
    } catch (error) {
      this.authTokenSubject.next(null);
    }
  }

  getToken(): string | null {
    return this.authTokenSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.authTokenSubject.value;
  }
}