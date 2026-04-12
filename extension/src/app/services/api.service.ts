import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

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
}

export interface JobApplication {
  id: number;
  company: string;
  role: string;
  location?: string | null;
  applied_through?: string | null;
  external_link?: string | null;
  notes?: string | null;
  date?: string;
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
  providedIn: 'root'
})
export class ApiService {
  constructor(private authService: AuthService) {}

  private async makeRequest<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    const token = this.authService.getToken();
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Token ${token}`
      };
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (Object.keys(errorData).length > 0) {
        const messages: string[] = [];
        for (const [field, errors] of Object.entries(errorData)) {
          if (Array.isArray(errors)) {
            messages.push(`${field}: ${errors.join(', ')}`);
          } else if (typeof errors === 'string') {
            messages.push(`${field}: ${errors}`);
          }
        }
        throw new Error(messages.join('; '));
      }
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(text);
    } catch {
      return {} as T;
    }
  }

  async getGroups(): Promise<Group[]> {
    return this.makeRequest<Group[]>('/jam/groups/');
  }

  async getSteps(): Promise<Step[]> {
    return this.makeRequest<Step[]>('/jam/steps/');
  }

  async getLeads(): Promise<Lead[]> {
    return this.makeRequest<Lead[]>('/jam/leads/?all=true');
  }

  async createJobApplication(data: Partial<JobApplication>): Promise<JobApplication> {
    return this.makeRequest<JobApplication>('/jam/jobapps/', 'POST', data);
  }

  async createTimelineEntry(data: { group: number; step: number; jobapp: number; notes?: string | null }): Promise<TimelineEntry> {
    return this.makeRequest<TimelineEntry>('/jam/timeline/', 'POST', data);
  }
}