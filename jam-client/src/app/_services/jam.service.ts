import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

    return this.runHttpCall('GET',
      environment.apiUrl + endpoint
    );
  }


  getJobApplication(jobAppId: number) {
    return this.runHttpCall('GET',
      environment.apiUrl + '/jam/jobapps/' + jobAppId + '/'
    );
  }


  createJobApplication(
    company: string,
    role: string,
    location: string,
    appliedThrough: string,
    externalLink: string,
    notes: string,
    date: string,
    group: number,
    initialStep: number
  ) {
    return this.runHttpCall('POST',
      environment.apiUrl + '/jam/jobapps/',
      { 
        "company": company,
        "role": role,
        "location": location,
        "applied_through": appliedThrough,
        "external_link": externalLink,
        "notes": notes,
        "date": date ? date : undefined,
        "group": group,
        "initial_step": initialStep
      }
    );
  }

  updateJobApplication(
    jobAppId: number,
    company: string,
    role: string,
    location: string,
    appliedThrough: string,
    externalLink: string,
    notes: string,
    date: string,
    group: number
  ) {
    return this.runHttpCall('PATCH',
      environment.apiUrl + '/jam/jobapps/' + jobAppId + '/',
      { 
        "company": company,
        "role": role,
        "location": location,
        "applied_through": appliedThrough,
        "external_link": externalLink,
        "notes": notes,
        "date": date ? date : undefined,
        "group": group
      }
    );
  }

  deleteJobApplication(jobAppId: number) {
    return this.runHttpCall('DELETE',
      environment.apiUrl + '/jam/jobapps/' + jobAppId + '/'
    );
  }

  getGroups() {
    return this.runHttpCall('GET',
      environment.apiUrl + '/jam/groups/'
    );
  }

  getSteps(initial: boolean = false) {
    let endpoint = '/jam/steps/';
    if (initial) {
      endpoint += 'initial/'
    }

    return this.runHttpCall('GET',
      environment.apiUrl + endpoint
    );
  }

  updateStep(stepId: number, stepName: string, stepNotes: string, color: string) {
    return this.runHttpCall('PATCH',
      environment.apiUrl + '/jam/steps/' + stepId +'/',
      { 
        "name": stepName,
        "notes": stepNotes ? stepNotes : undefined,
        "color": color ? color : undefined
      }
    );
  }

  createStep(stepName: string, stepNotes: string, stepType: string, color: string) {
    return this.runHttpCall('POST',
      environment.apiUrl + '/jam/steps/',
      { 
        "name": stepName,
        "notes": stepNotes ? stepNotes : undefined,
        "type": stepType,
        "color": color ? color : undefined
      }
    );
  }
  
  deleteStep(stepId: number) {
    return this.runHttpCall('DELETE',
      environment.apiUrl + '/jam/steps/' + stepId + '/'
    );
  }

  updateGroup(groupId: number, groupName: string, groupDesc: string) {
    return this.runHttpCall('PATCH',
      environment.apiUrl + '/jam/groups/' + groupId +'/',
      { "name": groupName, "description": groupDesc }
    );
  }

  createGroup(groupName: string, groupDesc: string) {
    return this.runHttpCall('POST',
      environment.apiUrl + '/jam/groups/',
      { "name": groupName, "description": groupDesc }
    );
  }

  deleteGroup(groupId: number) {
    return this.runHttpCall('DELETE',
      environment.apiUrl + '/jam/groups/' + groupId + '/'
    );
  }

  getTimeline(jobAppId: number) {
    return this.runHttpCall('GET',
      environment.apiUrl + '/jam/timeline/jobapp/' + jobAppId + '/'
    );
  }

  getAnalytics() {
    return this.runHttpCall('GET',
      environment.apiUrl + '/jam/analytics/'
    );
  }

  addStepToTimeline(
    jobAppId: number,
    jobAppGroup: number,
    nextStep: number,
    timelineNotes: string,
    date: string
  ) {
    return this.runHttpCall('POST',
      environment.apiUrl + '/jam/timeline/',
      {
        "group": jobAppGroup,
        "step": nextStep,
        "notes": timelineNotes ? timelineNotes : undefined,
        "jobapp": jobAppId,
        "date": date ? date : undefined
      }
    );
  }

  updateTimelineStep(
    timelineStepId: number,
    notes: string,
    date: string,
  ) {
    return this.runHttpCall('PATCH',
      environment.apiUrl + '/jam/timeline/' + timelineStepId + '/',
      {
        "notes": notes,
        "date": date ? date : undefined,
      }
    );
  }

  deleteTimelineStep(timelineStepId: number) {
    return this.runHttpCall('DELETE',
      environment.apiUrl + '/jam/timeline/' + timelineStepId + '/'
    )
  }

  getLeads() {
    return this.runHttpCall('GET',
      environment.apiUrl + '/jam/leads/'
    );
  }

  deleteLead(leadId: number) {
    return this.runHttpCall('DELETE',
      environment.apiUrl + '/jam/leads/' + leadId + '/'
    );
  }

  updateLead(leadId: number, location: string, notes: string, externalLink: string, role: string, company: string) {
    return this.runHttpCall('PATCH',
      environment.apiUrl + '/jam/leads/' + leadId +'/',
      {
        "company": company,
        "notes": notes,
        "role": role,
        "external_link": externalLink,
        "location": location
      }
    );
  }

  createLead(location: string, notes: string, externalLink: string, role: string, company: string) {
    return this.runHttpCall('POST',
      environment.apiUrl + '/jam/leads/',
      {
        "company": company,
        "notes": notes,
        "role": role,
        "external_link": externalLink,
        "location": location
      }
    );
  }

  runHttpCall(method: string, url: string, payload: any = null) {
    let authHeader = { headers: {"Authorization": "Token " + this.authService.getSessionToken()} };

    switch (method) {
      case 'GET':
        return this.http.get(url, authHeader);
      case 'POST':
        return this.http.post(url, payload, authHeader);
      case 'PATCH':
        return this.http.patch(url, payload, authHeader);
      case 'DELETE':
        return this.http.delete(url, authHeader);
      default:
        return new Observable();
    }
  }
}
