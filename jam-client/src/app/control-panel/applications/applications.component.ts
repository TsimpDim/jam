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
  public addStepModalIsOpen: boolean = false;
  public addStepForm: FormGroup;
  public steps: any;
  public nonStartingSteps: any;

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
    });

    this.addStepForm = this.formBuilder.group({
      'step': new FormControl('', [Validators.required]),
      'notes': new FormControl('', []),
      'date': new FormControl('', [])
    });
  }

  ngOnInit(): void {
    this.getApplications();
    this.getGroups();
    this.getSteps();
  }

  getApplications() {
    this.jamService.getJobApplications(true)
    .subscribe({
      next: (data: any) => {
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

  openAddStepModal() {
    this.addStepModalIsOpen = true;
  }

  closeAddStepModal() {
    this.addStepModalIsOpen = false;
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

  getSteps() {
    this.jamService.getSteps()
    .subscribe({
      next: (data) => {
        this.loading = false;
        this.steps = data;
        this.initialSteps = this.steps.filter((s: any) => s.type === 'S');
        this.nonStartingSteps = this.steps.filter((s: any) => s.type === 'D' || s.type == 'E');
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

  submitStepAdditionForm() {
    this.addStepToTimeline();
    this.closeAddStepModal();
  }

  addStepToTimeline() {
    let date = this.getProperDateFromField(this.addStepForm.value.date);

    this.jamService.addStepToTimeline(
      this.selectedApp.id,
      this.selectedApp.group,
      this.addStepForm.value.step,
      this.addStepForm.value.notes,
      date
    ).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.getTimeline();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  createJobApplication() {
    let date = this.getProperDateFromField(this.jobAppForm.value.date);

    this.jamService.createJobApplication(
      this.jobAppForm.value.company,
      this.jobAppForm.value.role,
      this.jobAppForm.value.location,
      this.jobAppForm.value.notes,
      date,
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

  getProperDateFromField(field: string) {
    let inputDate = new Date(field);
    return formatDate(inputDate, 'yyyy-MM-dd', 'en_US')
  }
}
