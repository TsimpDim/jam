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
  leadForm: FormGroup;
  modalIsOpen: boolean = false;
  selectedLead: any = null;

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
    })
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    this.closeModal();
  }

  ngOnInit(): void {
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
    this.jamService.getLeads()
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

  createLead() {
    this.loading = true;
    this.jamService.createLead(
      this.leadForm.value.location,
      this.leadForm.value.notes,
      this.leadForm.value.external_link,
      this.leadForm.value.role,
      this.leadForm.value.company
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
    this.jamService.updateLead(
      this.selectedLead.id,
      this.leadForm.value.location,
      this.leadForm.value.notes,
      this.leadForm.value.external_link,
      this.leadForm.value.role,
      this.leadForm.value.company
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
