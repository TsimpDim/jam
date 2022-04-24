import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { environment } from '../../environments/environment'
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private http: HttpClient,
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
}
