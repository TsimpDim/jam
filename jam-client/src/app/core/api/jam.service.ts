import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CVReview,
  ExperienceLevel,
  GroupReorderPayload,
  Industry,
  Role,
  UserInfo,
} from '../../interfaces';

@Injectable({
  providedIn: 'root',
})
export class JamService {
  constructor(private http: HttpClient) {}

  getJobApplications(groupped: boolean = false, sort: string = 'id') {
    let endpoint = '/jam/jobapps/';
    if (groupped) {
      endpoint += 'group/';
    }
    const params = new URLSearchParams();
    if (sort && sort !== 'id') {
      params.set('sort', sort);
    }
    const queryString = params.toString();
    const url =
      environment.apiUrl + endpoint + (queryString ? '?' + queryString : '');

    return this.runHttpCall('GET', url);
  }

  getJobApplication(jobAppId: number) {
    return this.runHttpCall(
      'GET',
      environment.apiUrl + '/jam/jobapps/' + jobAppId + '/'
    );
  }

  getJobAdSnapshot(jobAppId: number) {
    return this.runHttpCall(
      'GET',
      environment.apiUrl + '/jam/jobapps/' + jobAppId + '/ad-snapshot/'
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
    initialStep: number,
    lead: number | null = null,
    cvUsedId: number | null = null
  ) {
    return this.runHttpCall('POST', environment.apiUrl + '/jam/jobapps/', {
      company: company,
      role: role,
      location: location,
      applied_through: appliedThrough,
      external_link: externalLink,
      notes: notes,
      date: date ? date : undefined,
      group: group,
      initial_step: initialStep,
      lead: lead ? lead : undefined,
      cv_used: cvUsedId ? cvUsedId : undefined,
    });
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
    group: number,
    lead: number | null = null,
    cvUsedId: number | null = null
  ) {
    return this.runHttpCall(
      'PATCH',
      environment.apiUrl + '/jam/jobapps/' + jobAppId + '/',
      {
        company: company,
        role: role,
        location: location,
        applied_through: appliedThrough,
        external_link: externalLink,
        notes: notes,
        date: date ? date : undefined,
        group: group,
        lead: lead ? lead : undefined,
        cv_used: cvUsedId ? cvUsedId : undefined,
      }
    );
  }

  deleteJobApplication(jobAppId: number) {
    return this.runHttpCall(
      'DELETE',
      environment.apiUrl + '/jam/jobapps/' + jobAppId + '/'
    );
  }

  getGroups() {
    return this.runHttpCall('GET', environment.apiUrl + '/jam/groups/');
  }

  getSteps(initial: boolean = false) {
    let endpoint = '/jam/steps/';
    if (initial) {
      endpoint += 'initial/';
    }

    return this.runHttpCall('GET', environment.apiUrl + endpoint);
  }

  updateStep(
    stepId: number,
    stepName: string,
    stepNotes: string,
    color: string
  ) {
    return this.runHttpCall(
      'PATCH',
      environment.apiUrl + '/jam/steps/' + stepId + '/',
      {
        name: stepName,
        notes: stepNotes ? stepNotes : undefined,
        color: color ? color : undefined,
      }
    );
  }

  createStep(
    stepName: string,
    stepNotes: string,
    stepType: string,
    color: string
  ) {
    return this.runHttpCall('POST', environment.apiUrl + '/jam/steps/', {
      name: stepName,
      notes: stepNotes ? stepNotes : undefined,
      type: stepType,
      color: color ? color : undefined,
    });
  }

  deleteStep(stepId: number) {
    return this.runHttpCall(
      'DELETE',
      environment.apiUrl + '/jam/steps/' + stepId + '/'
    );
  }

  updateGroup(groupId: number, groupName: string, groupDesc: string) {
    return this.runHttpCall(
      'PATCH',
      environment.apiUrl + '/jam/groups/' + groupId + '/',
      { name: groupName, description: groupDesc }
    );
  }

  createGroup(groupName: string, groupDesc: string) {
    return this.runHttpCall('POST', environment.apiUrl + '/jam/groups/', {
      name: groupName,
      description: groupDesc,
    });
  }

  deleteGroup(groupId: number) {
    return this.runHttpCall(
      'DELETE',
      environment.apiUrl + '/jam/groups/' + groupId + '/'
    );
  }

  reorderGroups(groups: GroupReorderPayload[]): Observable<any> {
    return this.runHttpCall(
      'PATCH',
      environment.apiUrl + '/jam/groups/reorder/',
      { groups }
    );
  }

  getTimeline(jobAppId: number) {
    return this.runHttpCall(
      'GET',
      environment.apiUrl + '/jam/timeline/jobapp/' + jobAppId + '/'
    );
  }

  getAnalytics(groupId: string | null = null) {
    let endpoint = environment.apiUrl + '/jam/analytics/';
    if (groupId && groupId !== 'all') {
      endpoint += '?group=' + groupId;
    }
    return this.runHttpCall('GET', endpoint);
  }

  getSankeyData(groupId: string | null = null) {
    let endpoint = environment.apiUrl + '/jam/analytics/sankey/';
    if (groupId && groupId !== 'all') {
      endpoint += '?group=' + groupId;
    }
    return this.runHttpCall('GET', endpoint);
  }

  addStepToTimeline(
    jobAppId: number,
    jobAppGroup: number,
    nextStep: number,
    date: string
  ) {
    return this.runHttpCall('POST', environment.apiUrl + '/jam/timeline/', {
      group: jobAppGroup,
      step: nextStep,
      notes: undefined,
      jobapp: jobAppId,
      date: date ? date : undefined,
    });
  }

  updateTimelineStep(timelineStepId: number, data: {}) {
    return this.runHttpCall(
      'PATCH',
      environment.apiUrl + '/jam/timeline/' + timelineStepId + '/',
      data
    );
  }

  deleteTimelineStep(timelineStepId: number) {
    return this.runHttpCall(
      'DELETE',
      environment.apiUrl + '/jam/timeline/' + timelineStepId + '/'
    );
  }

  getLeads(archived: string = 'all') {
    return this.runHttpCall(
      'GET',
      environment.apiUrl + '/jam/leads/?archived=' + archived
    );
  }

  deleteLead(leadId: number) {
    return this.runHttpCall(
      'DELETE',
      environment.apiUrl + '/jam/leads/' + leadId + '/'
    );
  }

  updateLead(
    leadId: number,
    location: string,
    notes: string,
    externalLink: string,
    role: string,
    company: string,
    archived: boolean = false,
    group: number | null = null
  ) {
    return this.runHttpCall(
      'PATCH',
      environment.apiUrl + '/jam/leads/' + leadId + '/',
      {
        company: company,
        notes: notes,
        role: role,
        external_link: externalLink,
        location: location,
        archived: archived,
        group: group,
      }
    );
  }

  createLead(
    location: string,
    notes: string,
    externalLink: string,
    role: string,
    company: string,
    group: number | null = null
  ) {
    return this.runHttpCall('POST', environment.apiUrl + '/jam/leads/', {
      company: company,
      notes: notes,
      role: role,
      external_link: externalLink,
      location: location,
      group: group,
    });
  }

  archiveLead(leadId: number, archived: boolean = true) {
    return this.runHttpCall(
      'PATCH',
      environment.apiUrl + '/jam/leads/' + leadId + '/',
      {
        archived: archived,
      }
    );
  }

  getCVs() {
    return this.runHttpCall('GET', environment.apiUrl + '/jam/cvs/');
  }

  createCV(key: string, file: File) {
    const formData = new FormData();
    formData.append('key', key);
    formData.append('file', file);
    return this.http.post(environment.apiUrl + '/jam/cvs/', formData);
  }

  updateCV(cvId: number, key: string, file?: File) {
    const formData = new FormData();
    formData.append('key', key);
    if (file) {
      formData.append('file', file);
    }
    return this.http.patch(
      environment.apiUrl + '/jam/cvs/' + cvId + '/',
      formData
    );
  }

  deleteCV(cvId: number) {
    return this.runHttpCall(
      'DELETE',
      environment.apiUrl + '/jam/cvs/' + cvId + '/'
    );
  }

  downloadCV(cvId: number): Observable<Blob> {
    return this.http.get(
      environment.apiUrl + '/jam/cvs/' + cvId + '/download/',
      {
        responseType: 'blob',
      }
    );
  }

  getUserInfo(): Observable<UserInfo> {
    return this.runHttpCall('GET', environment.apiUrl + '/auth/me/');
  }

  // CV Review endpoints
  getCVReviews(cvId?: number): Observable<CVReview[]> {
    let url = environment.apiUrl + '/special/cv-reviews/';
    if (cvId) {
      url += '?cv=' + cvId;
    }
    return this.runHttpCall('GET', url);
  }

  requestCVReview(payload: {
    cv: number;
    industry: number;
    experience_level: number;
    roles: number[];
  }): Observable<CVReview> {
    return this.runHttpCall(
      'POST',
      environment.apiUrl + '/special/cv-reviews/',
      payload
    );
  }

  getIndustries(): Observable<Industry[]> {
    return this.runHttpCall('GET', environment.apiUrl + '/special/industries/');
  }

  getExperienceLevels(): Observable<ExperienceLevel[]> {
    return this.runHttpCall(
      'GET',
      environment.apiUrl + '/special/experience-levels/'
    );
  }

  getRoles(term: string | undefined = undefined): Observable<Role[]> {
    let url = environment.apiUrl + '/special/roles/';
    if (term) {
      url += `?search=${encodeURIComponent(term)}`;
    }

    return this.runHttpCall('GET', url);
  }

  runHttpCall(
    method: string,
    url: string,
    payload: any = null
  ): Observable<any> {
    switch (method) {
      case 'GET':
        return this.http.get(url);
      case 'POST':
        return this.http.post(url, payload);
      case 'PATCH':
        return this.http.patch(url, payload);
      case 'DELETE':
        return this.http.delete(url);
      default:
        return new Observable();
    }
  }
}
