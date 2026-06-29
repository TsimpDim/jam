import { Component, HostListener, OnInit } from '@angular/core';
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
import { LeadGenerationModalComponent } from 'src/app/modals/lead-generation-modal/lead-generation-modal.component';
import { UserInfo } from 'src/app/interfaces';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ClarityModule,
    LeadGenerationModalComponent,
  ],
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.scss'],
})
export class LeadsComponent implements OnInit {
  loading = false;
  leads: any;
  groups: any;
  leadForm: FormGroup;
  modalIsOpen: boolean = false;
  selectedLead: any = null;
  viewingArchived: boolean = false;
  applications: any[] = [];
  showLeadGenerationModal: boolean = false;
  inProgressCount: number = 0;
  userInfo: UserInfo | null = null;
  hasReachedDailyQuota: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private jamService: JamService,
    private snackbarService: SnackbarService,
  ) {
    this.leadForm = this.formBuilder.group({
      company: new FormControl('', [Validators.required]),
      role: new FormControl('', [Validators.required]),
      location: new FormControl('', []),
      externalLink: new FormControl('', []),
      notes: new FormControl('', []),
      group: new FormControl(null, []),
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.closeModal();
  }

  ngOnInit(): void {
    this.getLeads();
    this.getGroups();
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    this.jamService.getUserInfo().subscribe({
      next: (data) => {
        this.userInfo = data;
        this.loadLeadGenerationStatus(!data.is_premium);
      },
    });
  }

  loadLeadGenerationStatus(checkQuota: boolean): void {
    this.jamService.getLeadGenerationRequests().subscribe((requests) => {
      this.inProgressCount = requests.filter(
        (req) => req.is_done === false,
      ).length;
      if (checkQuota) {
        const today = new Date().toISOString().split('T')[0];
        this.hasReachedDailyQuota = requests.some((req) =>
          req.created_at.startsWith(today),
        );
      }
    });
  }

  toggleViewMode() {
    this.viewingArchived = !this.viewingArchived;
    this.getLeads();
  }

  submitForm() {
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched();
      return;
    }

    if (this.selectedLead === null) {
      this.createLead();
    } else {
      this.updateLead();
    }
  }

  getLeads() {
    this.loading = true;
    this.jamService
      .getLeads(this.viewingArchived ? 'true' : 'false')
      .subscribe({
        next: (data: any) => {
          this.leads = data;
        },
        error: () => {
          this.loading = false;
        },
        complete: () => (this.loading = false),
      });
  }

  getGroups() {
    this.jamService.getGroups().subscribe({
      next: (data: any) => {
        this.groups = data;
      },
    });
  }

  deleteLead(leadId: number) {
    this.loading = true;
    this.jamService.deleteLead(leadId).subscribe({
      next: () => {
        this.selectedLead = null;
        this.snackbarService.showSuccess('Lead deleted successfully.');
        this.getLeads();
      },
      error: () => {
        this.loading = false;
        this.snackbarService.showError(
          'An error occurred while deleting the lead.',
        );
      },
      complete: () => {
        this.loading = false;
        this.closeModal();
      },
    });
  }

  toggleLeadArchive(lead: any) {
    const newArchivedState = !lead.archived;
    this.loading = true;
    this.jamService.archiveLead(lead.id, newArchivedState).subscribe({
      next: () => {
        if (newArchivedState === false) {
          this.viewingArchived = false;
        }
        this.snackbarService.showSuccess(
          newArchivedState ? 'Lead archived.' : 'Lead unarchived.',
        );
        this.getLeads();
      },
      error: () => {
        this.loading = false;
        this.snackbarService.showError(
          'An error occurred while updating the lead.',
        );
      },
      complete: () => {
        this.loading = false;
        this.closeModal();
      },
    });
  }

  createLead() {
    this.loading = true;
    this.jamService
      .createLead(
        this.leadForm.value.location,
        this.leadForm.value.notes,
        this.leadForm.value.externalLink,
        this.leadForm.value.role,
        this.leadForm.value.company,
        this.leadForm.value.group,
      )
      .subscribe({
        next: () => {
          this.selectedLead = null;
          this.snackbarService.showSuccess('Lead created successfully.');
          this.getLeads();
          this.closeModal();
        },
        error: (e) => {
          this.loading = false;
          this.snackbarService.showError(
            this.snackbarService.getErrorMessage(
              e,
              'An error occurred while creating the lead.',
            ),
          );
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  updateLead() {
    this.loading = true;
    const archived = this.selectedLead ? this.selectedLead.archived : false;
    this.jamService
      .updateLead(
        this.selectedLead.id,
        this.leadForm.value.location,
        this.leadForm.value.notes,
        this.leadForm.value.externalLink,
        this.leadForm.value.role,
        this.leadForm.value.company,
        archived,
        this.leadForm.value.group,
      )
      .subscribe({
        next: () => {
          this.selectedLead = null;
          this.snackbarService.showSuccess('Lead updated successfully.');
          this.getLeads();
          this.closeModal();
        },
        error: (e) => {
          this.loading = false;
          this.snackbarService.showError(
            this.snackbarService.getErrorMessage(
              e,
              'An error occurred while updating the lead.',
            ),
          );
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  clearAndOpenModal() {
    this.leadForm.reset();
    this.selectedLead = null;
    this.applications = [];
    this.openModal();
  }

  openModal() {
    this.modalIsOpen = true;
  }

  closeModal() {
    this.modalIsOpen = false;
    this.selectedLead = null;
    this.applications = [];
  }

  selectLead(leadId: number) {
    this.selectedLead = this.leads.find((l: any) => l.id == leadId);
    this.applications = this.selectedLead?.applications || [];
    const formData = {
      company: this.selectedLead.company,
      role: this.selectedLead.role,
      location: this.selectedLead.location,
      externalLink: this.selectedLead.external_link,
      notes: this.selectedLead.notes,
      group: this.selectedLead.group,
    };
    this.leadForm.reset(formData);
    this.openModal();
  }

  openLeadGenerationModal() {
    this.showLeadGenerationModal = true;
  }

  onLeadGenerationSubmitted(payload: any) {
    this.loading = true;
    this.jamService.createLeadGenerationRequest(payload).subscribe({
      next: () => {
        this.snackbarService.showSuccess(
          'Lead generation request submitted successfully.',
        );
        this.snackbarService.showInfo(
          'Please come back in a few minutes to view the results.',
        );
        this.showLeadGenerationModal = false;
        this.loading = false;
        this.inProgressCount++;
        if (!this.userInfo?.is_premium) {
          this.hasReachedDailyQuota = true;
        }
      },
      error: (e) => {
        this.loading = false;
        this.showLeadGenerationModal = false;
        this.snackbarService.showError(
          this.snackbarService.getErrorMessage(
            e,
            'An error occurred while submitting the lead generation request.',
          ),
        );
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  onLeadGenerationModalClosed() {
    this.showLeadGenerationModal = false;
  }
}
