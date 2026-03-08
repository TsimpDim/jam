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
  showArchived: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private jamService: JamService
  ) {
    this.leadForm = this.formBuilder.group({
      "company": new FormControl('', [Validators.required]),
      "role": new FormControl('', []),
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

  toggleArchived() {
    this.showArchived = !this.showArchived;
    this.getLeads();
  }

  submitForm() {
    if (this.selectedLead === null) {
      this.createLead();
    } else {
      this.updateLead();
    }
  }

  getLeads() {
    this.loading = true;
    this.jamService.getLeads(this.showArchived)
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

  archiveLead(leadId: number, archived: boolean) {
    this.loading = true;
    this.jamService.archiveLead(leadId, archived)
    .subscribe({
      next: () => {
        this.getLeads();
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
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

  clearAndOpenModal() {
    this.leadForm.reset();
    this.openModal();
  }

  openModal() {
    this.modalIsOpen = true;
  }

  closeModal() {
    this.modalIsOpen = false;
    this.selectedLead = null;
  }

  selectLead(leadId: number) {
    this.selectedLead = this.leads.find((l: any) => l.id == leadId);
    this.leadForm.reset(this.selectedLead);
    this.openModal();
  }
}
