import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CVReview,
  CoverLetterGenerationRequest,
  ExperienceLevel,
  Industry,
  LeadGenerationRequest,
  Role,
  City,
  Country,
} from '../../interfaces';

@Injectable({
  providedIn: 'root',
})
export class SpecialService {
  constructor(private http: HttpClient) {}

  getCVReviews(cvId?: number): Observable<CVReview[]> {
    let url = environment.apiUrl + '/special/cv-reviews/';
    if (cvId) {
      url += '?cv=' + cvId;
    }
    return this.http.get<CVReview[]>(url);
  }

  requestCVReview(payload: {
    cv: number;
    industry: number;
    experience_level: number;
    roles: number[];
  }): Observable<CVReview> {
    return this.http.post<CVReview>(
      environment.apiUrl + '/special/cv-reviews/',
      payload
    );
  }

  getIndustries(): Observable<Industry[]> {
    return this.http.get<Industry[]>(environment.apiUrl + '/special/industries/');
  }

  getExperienceLevels(): Observable<ExperienceLevel[]> {
    return this.http.get<ExperienceLevel[]>(
      environment.apiUrl + '/special/experience-levels/'
    );
  }

  getRoles(term: string | undefined = undefined): Observable<Role[]> {
    let url = environment.apiUrl + '/special/roles/';
    if (term) {
      url += `?search=${encodeURIComponent(term)}`;
    }
    return this.http.get<Role[]>(url);
  }

  getCities(countrySlug?: string): Observable<City[]> {
    let url = environment.apiUrl + '/special/cities/';
    if (countrySlug) {
      url += `?country=${encodeURIComponent(countrySlug)}`;
    }
    return this.http.get<City[]>(url);
  }

  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(environment.apiUrl + '/special/countries/');
  }

  createLeadGenerationRequest(payload: {
    countries: number[];
    cities?: number[];
    company_leads_only: boolean;
    roles?: number[];
    modes: string[];
    experience_level: number[];
    industries?: number[];
    company_sizes: string[];
  }): Observable<LeadGenerationRequest> {
    return this.http.post<LeadGenerationRequest>(
      environment.apiUrl + '/special/lead-generation-requests/',
      payload
    );
  }

  getLeadGenerationRequests(): Observable<LeadGenerationRequest[]> {
    return this.http.get<LeadGenerationRequest[]>(
      environment.apiUrl + '/special/lead-generation-requests/'
    );
  }

  createCoverLetterRequest(payload: {
    cv: number;
    lead: number;
  }): Observable<CoverLetterGenerationRequest> {
    return this.http.post<CoverLetterGenerationRequest>(
      environment.apiUrl + '/special/cover-letter-requests/',
      payload
    );
  }

  getCoverLetterRequests(): Observable<CoverLetterGenerationRequest[]> {
    return this.http.get<CoverLetterGenerationRequest[]>(
      environment.apiUrl + '/special/cover-letter-requests/'
    );
  }
}
