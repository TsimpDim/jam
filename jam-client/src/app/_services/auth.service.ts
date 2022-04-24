import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { environment } from '../../environments/environment'
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  login(username: String, password: String) {
    return this.http.post(
      environment.apiUrl + '/auth/login/',
      {username: username, password: password}
    );
  }

  register(username: String, password1: String, password2: String) {
    return this.http.post(
      environment.apiUrl + '/auth/registration/',
      {username: username, password1: password1, password2: password2}
    );
  }

  logout() {
    if (this.getSessionToken()) {
      this.deleteSessionToken();
      this.router.navigate(['/auth/login']);
    }
  }

  deleteSessionToken() {
    localStorage.removeItem("session_id");
  }

  storeSessionToken(token: string) {
    localStorage.setItem("session_id", token);
  }

  getSessionToken() {
    return localStorage.getItem("session_id");
  }
}
