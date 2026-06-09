import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Group {
  id: number;
  name: string;
}

export interface Step {
  id: number;
  name: string;
  type: string;
}

export interface Lead {
  id: number;
  company: string;
  role: string;
  location?: string | null;
  external_link?: string | null;
  notes?: string | null;
}

export interface JobApplication {
  id: number;
  company: string;
  role: string;
  location?: string | null;
  applied_through?: string | null;
  external_link?: string | null;
  notes?: string | null;
  group: number;
  initial_step: number;
  lead?: number | null;
}

export interface TimelineEntry {
  id: number;
  group: number;
  step: number;
  jobapp: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getGroups(): Promise<Group[]> {
    return firstValueFrom(
      this.http.get<Group[]>(`${this.baseUrl}/groups/`)
    );
  }

  getSteps(): Promise<Step[]> {
    return firstValueFrom(this.http.get<Step[]>(`${this.baseUrl}/steps/`));
  }

  getLeads(): Promise<Lead[]> {
    return firstValueFrom(
      this.http.get<Lead[]>(`${this.baseUrl}/leads/`)
    );
  }

  createJobApplication(data: Partial<JobApplication>): Promise<JobApplication> {
    return firstValueFrom(
      this.http.post<JobApplication>(`${this.baseUrl}/applications/add/`, data)
    );
  }

  createLead(data: Partial<Lead>): Promise<Lead> {
    return firstValueFrom(
      this.http.post<Lead>(`${this.baseUrl}/leads/add/`, data)
    );
  }
}
