import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly AUTH_TOKEN_STORAGE_KEY = 'authToken';

  private authTokenSubject = new BehaviorSubject<string | null>(null);
  public authToken$ = this.authTokenSubject.asObservable();

  constructor() {
    this.checkLoginStatus();
  }

  private async getStorage(key: string): Promise<string | null> {
    const result = await browser.storage.local.get(key);
    return result[key] || null;
  }

  private async setStorage(key: string, value: string): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  }

  private async removeStorage(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  }

  async checkLoginStatus() {
    const authToken = await this.getStorage(this.AUTH_TOKEN_STORAGE_KEY);
    if (authToken) {
      this.authTokenSubject.next(authToken);
      return true;
    }

    this.authTokenSubject.next(null);
    return false;
  }

  async login(username: string, password: string): Promise<void> {
    try {
      const response = await fetch(`${environment.apiUrl}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.detail || 'Login failed. Please check your credentials.'
        );
      }

      const json = await response.json();
      const authToken = json.token;

      if (!authToken) {
        throw new Error('No token received from server.');
      }

      await this.setStorage(this.AUTH_TOKEN_STORAGE_KEY, authToken);
      this.authTokenSubject.next(authToken);
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    const authToken = this.authTokenSubject.value;
    if (authToken) {
      fetch(`${environment.apiUrl}/auth/logout/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${authToken}`,
        },
      });
    }

    await this.removeStorage(this.AUTH_TOKEN_STORAGE_KEY);
    this.authTokenSubject.next(null);
  }

  getAuthToken(): string | null {
    return this.authTokenSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.authTokenSubject.value;
  }
}
