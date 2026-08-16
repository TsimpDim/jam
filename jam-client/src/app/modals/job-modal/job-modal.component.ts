import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { FileUploadComponent } from '../../shared/file-upload/file-upload.component';
import { LeadPrefillModalComponent } from '../lead-prefill-modal/lead-prefill-modal.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-job-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ClarityModule,
    FileUploadComponent,
    LeadPrefillModalComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './job-modal.component.html',
  styleUrls: ['./job-modal.component.scss'],
})
export class JobModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() application: any = null;
  @Input() groupToSelect: any = null;
  @Input() isPremium: boolean = false;
  @Input() fileLimit: number | null = null;
  @Input() prefill: any = null;
  @Output() onClose = new EventEmitter();
  @Output() onApplicationsNeedUpdate = new EventEmitter();
  @Output() onApplicationCreated = new EventEmitter<{
    groupName: string;
    jobAppId: number;
  }>();

  @HostListener('document:keydown.escape', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.confirmDeleteOpen) {
      return;
    }
    if (this.leadPrefillPromptOpen) {
      this.closeLeadPrefillPrompt();
      return;
    }
    this.onClose.emit();
  }

  onFileCountChanged(files: any[]) {
    this.fileCount = files.length;
  }

  public jobAppForm: FormGroup;
  public loading: boolean = false;
  public fileCount: number = 0;
  public initialSteps: any = null;
  public groups: any = null;
  public leads: any = null;
  public cvs: any = null;
  public leadPrefillPromptOpen: boolean = false;
  public pendingLeadForPrefill: any = null;
  public confirmDeleteOpen: boolean = false;
  private lastPromptedLeadId: number | null = null;

  constructor(
    private jamService: JamService,
    private formBuilder: FormBuilder,
    private snackbarService: SnackbarService
  ) {
    this.jobAppForm = this.formBuilder.group({
      company: new FormControl('', [Validators.required]),
      role: new FormControl('', [Validators.required]),
      date: new FormControl('', []),
      location: new FormControl('', []),
      appliedThrough: new FormControl('', []),
      externalLink: new FormControl('', []),
      notes: new FormControl('', []),
      group: new FormControl('', [Validators.required]),
      initialStep: new FormControl('', []),
      lead: new FormControl(null, []),
      cvUsed: new FormControl(null, []),
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // if 'application' has changed, re-fill all the fields
    if (
      'application' in changes &&
      changes['application'].currentValue !== undefined &&
      changes['application'].currentValue !== null
    ) {
      let application = this.application;
      this.lastPromptedLeadId = application.lead || null;
      this.jobAppForm.patchValue({
        company: application.company,
        role: application.role,
        location: application.location || '',
        appliedThrough: application.applied_through || '',
        externalLink: application.external_link || '',
        notes: application.notes || '',
        date: application.date || '',
        group: application.group,
        lead: application.lead || null,
        cvUsed: application.cv_used || null,
      });
      this.jobAppForm.get('initialStep')?.clearValidators();
    } else if (
      'isOpen' in changes &&
      changes['isOpen'].currentValue === true &&
      (this.application === null || this.application === undefined)
    ) {
      this.resetForm();
      if (this.prefill !== null && this.prefill !== undefined) {
        this.applyPrefill(this.prefill);
      }
    }
  }

  applyPrefill(prefill: any) {
    this.lastPromptedLeadId = prefill.id ?? null;
    const patch: any = {
      company: prefill.company,
      role: prefill.role,
      location: prefill.location || '',
      externalLink: prefill.external_link || '',
      notes: prefill.notes || '',
      lead: prefill.id,
    };
    if (prefill.group) {
      patch.group = prefill.group;
    }
    this.jobAppForm.patchValue(patch);
  }

  resetForm() {
    this.jobAppForm.reset();
    if (this.groups !== null && this.initialSteps !== null) {
      this.jobAppForm.patchValue({
        group: this.getDefaultGroup(),
        initialStep: this.initialSteps[0].id,
        date: this.getTodayDate(),
      });
    }
  }

  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  getDefaultGroup() {
    let defaultGroupId = '';
    if (this.groups) {
      defaultGroupId = this.groups[0].id;
      if (this.groupToSelect) {
        defaultGroupId = this.groups.find(
          (g: any) => g.name === this.groupToSelect
        ).id;
      }
    }

    return defaultGroupId;
  }

  closeModal() {
    this.onClose.emit();
  }

  onClrModalOpenChange(open: boolean) {
    if (!open) {
      this.onClose.emit();
    }
  }

  ngOnInit(): void {
    this.getInitialSteps();
    this.getGroups();
    this.getLeads();
    this.getCVs();
    this.jobAppForm
      .get('lead')
      ?.valueChanges.subscribe((leadId) =>
        this.onLeadFormSelectionChanged(leadId),
      );
  }

  onLeadFormSelectionChanged(leadId: any) {
    if (leadId === null || leadId === undefined || leadId === '') {
      this.lastPromptedLeadId = null;
      return;
    }
    if (leadId === this.lastPromptedLeadId) {
      return;
    }
    this.lastPromptedLeadId = leadId;
    const lead = this.leads?.find((l: any) => l.id === leadId);
    if (lead) {
      this.pendingLeadForPrefill = lead;
      this.leadPrefillPromptOpen = true;
    }
  }

  confirmLeadPrefill() {
    const lead = this.pendingLeadForPrefill;
    if (lead) {
      const patch: any = {
        company: lead.company,
        role: lead.role,
        location: lead.location || '',
        externalLink: lead.external_link || '',
        notes: lead.notes || '',
      };
      if (lead.group) {
        patch.group = lead.group;
      }
      this.jobAppForm.patchValue(patch);
    }
    this.closeLeadPrefillPrompt();
  }

  closeLeadPrefillPrompt() {
    this.leadPrefillPromptOpen = false;
    this.pendingLeadForPrefill = null;
  }

  submitJobAppForm() {
    if (this.jobAppForm.invalid) {
      this.jobAppForm.markAllAsTouched();
      return;
    }

    if (this.application === null) {
      this.createJobApplication();
    } else {
      this.updateJobApplication();
    }
  }

  getGroups() {
    this.jamService.getGroups().subscribe({
      next: (data) => {
        this.groups = data;

        // set default value in form
        if (!this.jobAppForm.get('group')?.value) {
          this.jobAppForm.patchValue({
            group: this.getDefaultGroup(),
          });
        }
      },
    });
  }

  getLeads() {
    this.jamService.getLeads('all').subscribe({
      next: (data) => {
        this.leads = data;
      },
    });
  }

  getInitialSteps() {
    this.jamService.getSteps().subscribe({
      next: (data: any) => {
        this.initialSteps = data.filter((s: any) => s.type === 'S');

        // set default value in form
        if (!this.jobAppForm.get('initialStep')?.value) {
          this.jobAppForm.patchValue({
            initialStep: this.initialSteps[0]?.id,
          });
        }
      },
    });
  }

  getCVs() {
    this.jamService.getCVs().subscribe({
      next: (data) => {
        this.cvs = data;
      },
    });
  }

  createJobApplication() {
    this.loading = true;
    this.jamService
      .createJobApplication(
        this.jobAppForm.value.company,
        this.jobAppForm.value.role,
        this.jobAppForm.value.location,
        this.jobAppForm.value.appliedThrough,
        this.jobAppForm.value.externalLink,
        this.jobAppForm.value.notes,
        this.jobAppForm.value.date,
        this.jobAppForm.value.group,
        this.jobAppForm.value.initialStep,
        this.jobAppForm.value.lead,
        this.jobAppForm.value.cvUsed
      )
      .subscribe({
        next: (data: any) => {
          this.snackbarService.showSuccess('Job application created successfully.');
          this.closeModal();
          this.onApplicationsNeedUpdate.emit();
          this.onApplicationCreated.emit(data);
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.snackbarService.showError(
            this.snackbarService.getErrorMessage(
              e,
              'An error occurred while creating the job application.'
            )
          );
        },
      });
  }

  updateJobApplication() {
    this.loading = true;
    this.jamService
      .updateJobApplication(
        this.application.id,
        this.jobAppForm.value.company,
        this.jobAppForm.value.role,
        this.jobAppForm.value.location,
        this.jobAppForm.value.appliedThrough,
        this.jobAppForm.value.externalLink,
        this.jobAppForm.value.notes,
        this.jobAppForm.value.date,
        this.jobAppForm.value.group,
        this.jobAppForm.value.lead,
        this.jobAppForm.value.cvUsed
      )
      .subscribe({
        next: () => {
          this.application = null;
          this.snackbarService.showSuccess('Job application updated successfully.');
          this.closeModal();
          this.onApplicationsNeedUpdate.emit();
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.snackbarService.showError(
            this.snackbarService.getErrorMessage(
              e,
              'An error occurred while updating the job application.'
            )
          );
        },
      });
  }

  deleteJobApp(jobAppId: number) {
    this.loading = true;
    this.jamService.deleteJobApplication(jobAppId).subscribe({
      next: () => {
        this.application = null;
        this.snackbarService.showSuccess('Job application deleted successfully.');
        this.onApplicationsNeedUpdate.emit();
      },
      error: () => {
        this.loading = false;
        this.snackbarService.showError('An error occurred while deleting the job application.');
      },
      complete: () => {
        this.closeModal();
        this.loading = false;
      },
    });
  }

  openDeleteConfirm() {
    this.confirmDeleteOpen = true;
  }

  onDeleteConfirmed() {
    this.confirmDeleteOpen = false;
    if (this.application !== null) {
      this.deleteJobApp(this.application.id);
    }
  }

  onDeleteCancelled() {
    this.confirmDeleteOpen = false;
  }
}
