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
      endpoint += "group/";
    }

    return this.http.get(
      environment.apiUrl + endpoint,
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  createJobApplication(
    company: string,
    role: string,
    location: string,
    notes: string,
    date: string,
    group: number,
    initialStep: number
  ) {
    return this.http.post(
      environment.apiUrl + '/jam/jobapps/',
      { 
        "company": company,
        "role": role,
        "location": location,
        "notes": notes,
        "date": date,
        "group": group,
        "initial_step": initialStep
      },
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  updateJobApplication(
    jobAppId: number,
    company: string,
    role: string,
    location: string,
    notes: string,
    date: string,
    group: number
  ) {
    return this.http.patch(
      environment.apiUrl + '/jam/jobapps/' + jobAppId + '/',
      { 
        "company": company,
        "role": role,
        "location": location,
        "notes": notes,
        "date": date,
        "group": group
      },
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  deleteJobApplication(jobAppId: number) {
    return this.http.delete(
      environment.apiUrl + '/jam/jobapps/' + jobAppId + '/',
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  getGroups() {
    return this.http.get(
      environment.apiUrl + '/jam/groups/',
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  getSteps(initial: boolean = false) {
    let endpoint = '/jam/steps/';
    if (initial) {
      endpoint += 'initial/'
    }
    return this.http.get(
      environment.apiUrl + endpoint,
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  updateStep(stepId: number, stepName: string, stepNotes: string, color: string) {
    return this.http.patch(
      environment.apiUrl + '/jam/steps/' + stepId +'/',
      { "name": stepName, "notes": stepNotes, "color": color },
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  createStep(stepName: string, stepNotes: string, stepType: string, color: string) {
    return this.http.post(
      environment.apiUrl + '/jam/steps/',
      { "name": stepName, "notes": stepNotes, "type": stepType, "color": color },
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

  getTimeline(jobAppId: number) {
    return this.http.get(
      environment.apiUrl + '/jam/timeline/jobapp/' + jobAppId + '/',
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  addStepToTimeline(
    jobAppId: number,
    jobAppGroup: number,
    nextStep: number,
    timelineNotes: string,
    date: string
  ) {
    return this.http.post(
      environment.apiUrl + '/jam/timeline/',
      {
        "group": jobAppGroup,
        "step": nextStep,
        "notes": timelineNotes,
        "jobapp": jobAppId,
        "date": date
      },
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  updateTimelineStep(
    timelineStepId: number,
    notes: string,
    date: string,
  ) {
    return this.http.patch(
      environment.apiUrl + '/jam/timeline/' + timelineStepId + '/',
      { 
        "notes": notes,
        "date": date,
      },
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }

  deleteTimelineStep(timelineStepId: number) {
    return this.http.delete(
      environment.apiUrl + '/jam/timeline/' + timelineStepId + '/',
      { headers: {"Authorization": "Token " + this.authService.getSessionToken()} }
    );
  }
}
