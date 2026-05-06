import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { PageData } from '../add-app/add-app.component';

declare const chrome: any;

@Component({
  selector: 'app-add-lead',
  templateUrl: './add-lead.component.html',
  styleUrls: ['./add-lead.component.scss'],
})
export class AddLeadComponent implements OnInit {
  form!: FormGroup;

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
    this.form = this.formBuilder.group({
      company: ['', Validators.required],
      role: ['', Validators.required],
      location: [''],
      externalLink: [''],
      notes: [''],
    });
  }

  async loadData(): Promise<void> {
    try {
      await this.scrapeCurrentTab();
      this.populateFormFromPageData();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to load page data';
    }
  }

  private async scrapeCurrentTab(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tabs[0] || !tabs[0].id) return;

      const tabId = tabs[0].id;

      // Inject the content script to ensure it's present on the page
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js'],
        });
      } catch (_) {
        // Injection may fail on restricted pages (chrome://, chrome-extension://, etc.)
      }

      const response = await new Promise<any>((resolve) => {
        const timeout = setTimeout(() => resolve(null), 3000);
        chrome.tabs.sendMessage(
          tabId,
          { action: 'extractPageData' },
          (res: any) => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
              resolve(null);
            } else {
              resolve(res);
            }
          }
        );
      });

      if (response && response.pageData) {
        this.pageData = response.pageData;
      }
    } catch (_) {
      // Silently handle errors - scraping is a best-effort feature
    }
  }

  private populateFormFromPageData(): void {
    if (!this.pageData) return;

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
    if (
      this.pageData.salary ||
      this.pageData.employmentType ||
      this.pageData.remote
    ) {
      const extras: string[] = [];
      if (this.pageData.salary) extras.push(`Salary: ${this.pageData.salary}`);
      if (this.pageData.employmentType)
        extras.push(`Type: ${this.pageData.employmentType}`);
      if (this.pageData.remote) extras.push('Remote: Yes');
      const existingNotes = this.form.get('notes')?.value || '';
      const separator = existingNotes ? '\n' : '';
      this.form
        .get('notes')
        ?.setValue(extras.join('\n') + separator + existingNotes);
    }
  }

  async onSave(): Promise<void> {
    const { company, role } = this.form.value;

    if (!company || !role) {
      this.errorMessage = 'Please fill in company and role';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    try {
      const leadData = {
        company,
        role,
        location: this.form.value.location || null,
        external_link: this.form.value.externalLink || null,
        notes: this.form.value.notes || null,
      };

      await this.apiService.createLead(leadData);

      this.successMessage = 'Lead saved successfully!';

      setTimeout(() => {
        this.resetForm();
        this.router.navigate(['/dashboard']);
      }, 1500);
    } catch (error: any) {
      this.errorMessage =
        error.message || 'Failed to save lead. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  onCancel(): void {
    this.resetForm();
    this.router.navigate(['/dashboard']);
  }

  private resetForm(): void {
    this.form.reset();
    this.errorMessage = '';
    this.successMessage = '';
    this.pageData = null;
  }
}
