import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-leads',
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.scss']
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
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private jamService: JamService
  ) {
    this.leadForm = this.formBuilder.group({
      "company": new FormControl('', [Validators.required]),
      "role": new FormControl('', [Validators.required]),
      "location": new FormControl('', []),
      "externalLink": new FormControl('', []),
      "notes": new FormControl('', []),
      "group": new FormControl(null, []),
    })
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    this.closeModal();
  }

  ngOnInit(): void {
    this.getLeads();
    this.getGroups();
  }

  toggleViewMode() {
    this.viewingArchived = !this.viewingArchived;
    this.getLeads();
  }

  submitForm() {
    this.errorMessage = '';
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
    this.jamService.getLeads(this.viewingArchived ? 'true' : 'false')
    .subscribe({
      next: (data: any) => {
        this.leads = data;
      },
      error: () => {
        this.loading = false;
      },
      complete: () => this.loading = false
    })
  }

  getGroups() {
    this.jamService.getGroups()
    .subscribe({
      next: (data: any) => {
        this.groups = data;
      }
    })
  }

  deleteLead(leadId: number) {
    this.loading = true;
    this.jamService.deleteLead(
      leadId
    ).subscribe({
      next: () => {
        this.selectedLead = null;
        this.getLeads();
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        this.closeModal();
      }
    })
  }

  toggleLeadArchive(lead: any) {
    const newArchivedState = !lead.archived;
    this.loading = true;
    this.jamService.archiveLead(lead.id, newArchivedState)
    .subscribe({
      next: () => {
        if (newArchivedState === false) {
          this.viewingArchived = false;
        }
        this.getLeads();
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        this.closeModal();
      }
    })
  }

  createLead() {
    this.loading = true;
    this.jamService.createLead(
      this.leadForm.value.location,
      this.leadForm.value.notes,
      this.leadForm.value.externalLink,
      this.leadForm.value.role,
      this.leadForm.value.company,
      this.leadForm.value.group
    ).subscribe({
      next: () => {
        this.selectedLead = null;
        this.getLeads();
        this.closeModal();
      },
      error: (e) => {
        this.loading = false;
        this.errorMessage = 'An error occurred while creating the lead.';
        if (e.error) {
          this.errorMessage = JSON.stringify(e.error);
        }
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  updateLead() {
    this.loading = true;
    const archived = this.selectedLead ? this.selectedLead.archived : false;
    this.jamService.updateLead(
      this.selectedLead.id,
      this.leadForm.value.location,
      this.leadForm.value.notes,
      this.leadForm.value.externalLink,
      this.leadForm.value.role,
      this.leadForm.value.company,
      archived,
      this.leadForm.value.group
    ).subscribe({
      next: () => {
        this.selectedLead = null;
        this.getLeads();
        this.closeModal();
      },
      error: (e) => {
        this.loading = false;
        this.errorMessage = 'An error occurred while updating the lead.';
        if (e.error) {
          this.errorMessage = JSON.stringify(e.error);
        }
      },
      complete: () => {
        this.loading = false;
      }
    })
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
      group: this.selectedLead.group
    };
    this.leadForm.reset(formData);
    this.openModal();
  }
}
