import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {
  public applications: any;
  public loading: boolean = true;
  public selectedApp: any = null;
  public creationModalIsOpen: boolean = false;
  public jobAppForm: FormGroup;
  public groups: any;
  public initialSteps: any;
  public selectedAppTimeline: any;

  constructor(
    private jamService: JamService,
    private formBuilder: FormBuilder
  ) {
    this.jobAppForm = this.formBuilder.group({
      'company': new FormControl('', [Validators.required]),
      'role': new FormControl('', [Validators.required]),
      'date': new FormControl('', [Validators.required]),
      'location': new FormControl('', []),
      'notes': new FormControl('', []),
      'group': new FormControl('', [Validators.required]),
      'currentStep': new FormControl('', [Validators.required])
    })
  }

  ngOnInit(): void {
    this.getApplications();
    this.getGroups();
    this.getInitialSteps();
  }

  getApplications() {
    this.jamService.getJobApplications(true)
    .subscribe({
      next: (data) => {
        this.loading = false;
        this.applications = data;
      },
      error: (error) => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  selectApp(groupName:any, jobAppId: any) {
    let appsOfGroup = this.applications[groupName];
    let selectedJobApp = appsOfGroup.find((app: any) => app.id == jobAppId);
    this.selectedApp = selectedJobApp;
    this.getTimeline();
  }

  openCreationModal() {
    this.creationModalIsOpen = true;
  }

  closeCreationModal() {
    this.creationModalIsOpen = false;
    this.selectedApp = null;
  }

  getGroups() {
    this.jamService.getGroups()
    .subscribe({
      next: (data) => {
        this.loading = false;
        this.groups = data;
      },
      error: (error) => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  getInitialSteps() {
    this.jamService.getSteps(true)
    .subscribe({
      next: (data) => {
        this.loading = false;
        this.initialSteps = data;
      },
      error: (error) => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  getTimeline() {
    this.jamService.getTimeline(this.selectedApp.id)
    .subscribe({
      next: (data: any) => {
        this.loading = false;
        this.selectedAppTimeline = data;
      },
      error: () => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  submitCreationForm() {
    this.createJobApplication();
    this.closeCreationModal();
  }

  createJobApplication() {
    let inputDate = new Date(this.jobAppForm.value.date);
    let formattedDate = formatDate(inputDate, 'yyyy-MM-dd', 'en_US')

    this.jamService.createJobApplication(
      this.jobAppForm.value.company,
      this.jobAppForm.value.role,
      this.jobAppForm.value.location,
      this.jobAppForm.value.notes,
      formattedDate,
      this.jobAppForm.value.group,
      this.jobAppForm.value.currentStep
    ).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.getApplications();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }
}
