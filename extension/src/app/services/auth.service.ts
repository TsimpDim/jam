import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface TokenResponse {
  token: string;
  user: { pk: number; username: string };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly AUTH_TOKEN_STORAGE_KEY = 'authToken';

  private authTokenSubject = new BehaviorSubject<string | null>(null);
  public authToken$ = this.authTokenSubject.asObservable();

  constructor(private http: HttpClient) {
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

  async checkLoginStatus(): Promise<boolean> {
    const authToken = await this.getStorage(this.AUTH_TOKEN_STORAGE_KEY);
    this.authTokenSubject.next(authToken);
    return authToken !== null;
  }

  async login(username: string, password: string): Promise<void> {
    const json = await firstValueFrom(
      this.http.post<TokenResponse>(`${environment.apiUrl}/auth/login/`, {
        username,
        password,
      })
    );

    if (!json.token) {
      throw new Error('No token received from server.');
    }

    await this.setStorage(this.AUTH_TOKEN_STORAGE_KEY, json.token);
    this.authTokenSubject.next(json.token);
  }

  async logout(): Promise<void> {
    const token = this.authTokenSubject.value;
    if (token) {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/logout/`, {})
      ).catch(() => {
        // Proceed with local logout even if the server call fails
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
