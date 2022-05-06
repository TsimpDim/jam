import { formatDate } from '@angular/common';
import { ThisReceiver } from '@angular/compiler';
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
  public timelineStepModalIsOpen: boolean = false;
  public timelineStepForm: FormGroup;
  public steps: any;
  public nonStartingSteps: any;
  public editTimelineModalIsOpen: boolean = false;
  public selectedTimelineStep: any = null;

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
      'initialStep': new FormControl('', [Validators.required])
    });

    this.timelineStepForm = this.formBuilder.group({
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

    this.jobAppForm.reset({
      'company': this.selectedApp.company,
      'role': this.selectedApp.role,
      'date': this.getProperDisplayDate(this.selectedApp.date),
      'location': this.selectedApp.location,
      'notes': this.selectedApp.notes,
      'group': this.selectedApp.group,
      'initialStep': this.selectedApp.initial_step
    });

    this.getTimeline();
  }

  openAndClearJobAppModal() {
    this.creationModalIsOpen = true;
    this.jobAppForm.reset();
    this.selectedApp = null;
  }

  openJobAppModal() {
    this.creationModalIsOpen = true;
  }

  closeJobAppModal() {
    this.creationModalIsOpen = false;
    this.selectedApp = null;
  }

  openTimelineStepModal() {
    this.timelineStepModalIsOpen = true;
    this.timelineStepForm.reset();
    this.selectedTimelineStep = null;
  }

  closeTimelineStepModal() {
    this.timelineStepModalIsOpen = false;
  }

  openEditTimelineModal(timelineStepId: any) {
    this.selectedTimelineStep = this.selectedAppTimeline.find((timelineSteps: any) => timelineSteps.id == timelineStepId)
    this.timelineStepModalIsOpen = true;
    let date = this.getProperDisplayDate(this.selectedTimelineStep.date);
    this.timelineStepForm.reset({
      'date': date,
      'notes': this.selectedTimelineStep.notes
    });
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

  submitJobAppForm() {
    if (this.selectedApp === null) {
      this.createJobApplication();
    } else {
      this.updateJobApplication();
    }
    this.closeJobAppModal();
  }

  submitTimelineStepForm() {
    if (this.selectedTimelineStep === null) {
      this.addStepToTimeline();
    } else {
      this.updateTimelineStep();
    }

    this.closeTimelineStepModal();
  }

  addStepToTimeline() {
    let date = this.getProperDateFromField(this.timelineStepForm.value.date);

    this.jamService.addStepToTimeline(
      this.selectedApp.id,
      this.selectedApp.group,
      this.timelineStepForm.value.step,
      this.timelineStepForm.value.notes,
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
  
  updateTimelineStep() {
    let date = this.getProperDateFromField(this.timelineStepForm.value.date);
    this.jamService.updateTimelineStep(
      this.selectedTimelineStep.id,
      this.timelineStepForm.value.notes,
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
      this.jobAppForm.value.initialStep
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

  updateJobApplication() {
    let date = this.getProperDateFromField(this.jobAppForm.value.date);

    this.jamService.updateJobApplication(
      this.selectedApp.id,
      this.jobAppForm.value.company,
      this.jobAppForm.value.role,
      this.jobAppForm.value.location,
      this.jobAppForm.value.notes,
      date,
      this.jobAppForm.value.group
    ).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.getApplications();
        this.selectedApp = null;
      },
      error: () => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  deleteJobApp(jobAppId: number) {
    this.jamService.deleteJobApplication(
      jobAppId
    ).subscribe({
      next: () => {
        this.loading = false;
        this.selectedApp = null;
        this.getApplications();
        this.closeJobAppModal();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  deleteTimelineStep() {
    this.jamService.deleteTimelineStep(
      this.selectedTimelineStep.id
    ).subscribe({
      next: () => {
        this.loading = false;
        this.selectedTimelineStep = null;
        this.getTimeline();
        this.closeTimelineStepModal();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  getProperDateFromField(field: string) {
    let inputDate = new Date(field);
    return formatDate(inputDate, 'yyyy-MM-dd', 'en_US')
  }

  getProperDisplayDate(date: string) {
    let inputDate = new Date(date);
    return formatDate(inputDate, 'MM/dd/yyyy', 'en_US')
  }
}
