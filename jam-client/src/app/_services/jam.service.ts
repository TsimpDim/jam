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
    let endpoint = '/jam/jobapps/';
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
      environment.apiUrl + '/jam/groups/',
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  getSteps() {
    return this.http.get(
      environment.apiUrl + '/jam/steps/',
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  updateStep(stepId: number, stepName: string, stepNotes: string) {
    return this.http.patch(
      environment.apiUrl + '/jam/steps/' + stepId +'/',
      { "name": stepName, "notes": stepNotes },
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  createStep(stepName: string, stepNotes: string, stepType: string) {
    return this.http.post(
      environment.apiUrl + '/jam/steps/',
      { "name": stepName, "notes": stepNotes, "type": stepType },
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }
  
  deleteStep(stepId: number) {
    return this.http.delete(
      environment.apiUrl + '/jam/steps/' + stepId + '/',
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  updateGroup(groupId: number, groupName: string, groupDesc: string) {
    return this.http.patch(
      environment.apiUrl + '/jam/groups/' + groupId +'/',
      { "name": groupName, "description": groupDesc },
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  createGroup(groupName: string, groupDesc: string) {
    return this.http.post(
      environment.apiUrl + '/jam/groups/',
      { "name": groupName, "description": groupDesc },
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  deleteGroup(groupId: number) {
    return this.http.delete(
      environment.apiUrl + '/jam/groups/' + groupId + '/',
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }
}
