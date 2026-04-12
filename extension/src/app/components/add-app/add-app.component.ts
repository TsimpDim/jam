import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Group, Lead, Step } from '../../services/api.service';

declare const chrome: any;

export interface PageData {
  title?: string;
  company?: string;
  location?: string;
  url?: string;
  description?: string;
}

@Component({
  selector: 'app-add-app',
  templateUrl: './add-app.component.html',
  styleUrls: ['./add-app.component.scss'],
})
export class AddAppComponent implements OnInit {
  form!: FormGroup;
  groups: Group[] = [];
  leads: Lead[] = [];
  initialSteps: Step[] = [];

  errorMessage = '';
  successMessage = '';
  loading = false;
  pageData: PageData | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.formBuilder.group({
      company: ['', Validators.required],
      lead: [''],
      role: ['', Validators.required],
      location: [''],
      appliedThrough: [''],
      externalLink: [''],
      notes: [''],
      date: [today],
      group: ['', Validators.required],
      initialStep: ['', Validators.required],
    });
  }

  async loadData(): Promise<void> {
    try {
      this.groups = await this.apiService.getGroups();
      
      const steps = await this.apiService.getSteps();
      this.initialSteps = steps.filter((s) => s.type === 'S');
      
      this.leads = await this.apiService.getLeads();

      if (this.groups.length > 0) {
        this.form.get('group')?.setValue(this.groups[0].id);
      }
      if (this.initialSteps.length > 0) {
        this.form.get('initialStep')?.setValue(this.initialSteps[0].id);
      }

      await this.scrapeCurrentTab();
      this.populateFormFromPageData();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to load data';
    }
  }

  private async scrapeCurrentTab(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0] && tabs[0].id) {
        const response = await new Promise<any>((resolve) => {
          const timeout = setTimeout(() => resolve(null), 2000);
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: 'extractPageData' },
            (res: any) => {
              clearTimeout(timeout);
              resolve(res);
            }
          );
        });
        if (response && response.pageData) {
          this.pageData = response.pageData;
        }
      }
    } catch (e) {}
  }

  private populateFormFromPageData(): void {
    if (this.pageData) {
      if (this.pageData.title) {
        this.form.get('role')?.setValue(this.pageData.title);
      }
      if (this.pageData.company) {
        this.form.get('company')?.setValue(this.pageData.company);
      }
      if (this.pageData.location) {
        this.form.get('location')?.setValue(this.pageData.location);
      }
      if (this.pageData.url) {
        this.form.get('externalLink')?.setValue(this.pageData.url);
      }
    }
  }

  async onSave(): Promise<void> {
    const { company, role, group, initialStep } = this.form.value;

    if (!company || !role) {
      this.errorMessage = 'Please fill in company and role';
      return;
    }

    if (!group || !initialStep) {
      this.errorMessage = 'Please select group and initial step';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    try {
      const jobData = {
        company,
        role,
        location: this.form.value.location || null,
        applied_through: this.form.value.appliedThrough || null,
        external_link: this.form.value.externalLink || null,
        notes: this.form.value.notes || null,
        date: this.form.value.date || undefined,
        group: parseInt(group),
        initial_step: parseInt(initialStep),
        lead: this.form.value.lead ? parseInt(this.form.value.lead) : null,
      };

      await this.apiService.createJobApplication(jobData);

      this.successMessage = 'Application submitted successfully!';

      setTimeout(() => {
        this.resetForm();
        this.router.navigate(['/dashboard']);
      }, 1500);
    } catch (error: any) {
      this.errorMessage =
        error.message || 'Failed to submit application. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.resetForm();
    this.router.navigate(['/dashboard']);
  }

  private resetForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form.reset({
      date: today,
      group: this.groups[0]?.id,
      initialStep: this.initialSteps[0]?.id,
    });
    this.errorMessage = '';
    this.successMessage = '';
    this.pageData = null;
  }
}
