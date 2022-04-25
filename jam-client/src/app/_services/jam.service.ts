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
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  getGroups() {
    return this.http.get(
      environment.apiUrl + '/jam/group/',
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  updateGroup(groupId: number, groupName: string, groupDesc: string) {
    return this.http.patch(
      environment.apiUrl + '/jam/group/' + groupId +'/',
      { "name": groupName, "description": groupDesc },
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  createGroup(groupName: string, groupDesc: string) {
    return this.http.post(
      environment.apiUrl + '/jam/group/',
      { "name": groupName, "description": groupDesc },
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  deleteGroup(groupId: number) {
    return this.http.delete(
      environment.apiUrl + '/jam/group/' + groupId + '/',
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }
}
