import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment'
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class JamService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getJobApplications(groupped: Boolean = false) {
    let endpoint = '/jam/jobapp/';
    if (groupped) {
      endpoint += "group";
    }

    return this.http.get(
      environment.apiUrl + endpoint,
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()}}
    );
  }

}
