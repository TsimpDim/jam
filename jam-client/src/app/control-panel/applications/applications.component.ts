import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { objectsIcon } from '@cds/core/icon';
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
  public jobAppModalIsOpen: boolean = false;
  public selectedAppTimeline: any;
  public timelineStepModalIsOpen: boolean = false;
  public steps: any;
  public nonStartingSteps: any;
  public editTimelineModalIsOpen: boolean = false;
  public selectedTimelineStep: any = null;

  constructor (
    private jamService: JamService
  ) {}

  ngOnInit(): void {
    this.getApplications();
    this.getSteps();
  }

  getApplications() {
    this.jamService.getJobApplications(true)
    .subscribe({
      next: (data: any) => {
        this.loading = false;
        this.applications = data;

        if (this.selectedApp !== null) {
          this.selectApp(this.selectedApp.group_name, this.selectedApp.id);
        }
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

    if (selectedJobApp !== undefined) {
      this.selectedApp = selectedJobApp;

      this.getTimeline();
    } else {
      this.selectedApp = null;
    }
  }

  openAndClearJobAppModal() {
    this.jobAppModalIsOpen = true;
    this.selectedApp = null;
  }

  openJobAppModal() {
    this.jobAppModalIsOpen = true;
  }

  closeAndClearJobAppModal() {
    this.jobAppModalIsOpen = false
    this.selectedApp = null;
  }

  openTimelineStepModal() {
    this.timelineStepModalIsOpen = true;
    this.selectedTimelineStep = null;
  }

  closeTimelineStepModal() {
    this.timelineStepModalIsOpen = false;
  }

  openEditTimelineModal(timelineStepId: any) {
    this.selectedTimelineStep = this.selectedAppTimeline.find((timelineSteps: any) => timelineSteps.id == timelineStepId)
    this.timelineStepModalIsOpen = true;
  }

  getSteps() {
    this.jamService.getSteps()
    .subscribe({
      next: (data) => {
        this.loading = false;
        this.steps = data;
        this.nonStartingSteps = this.steps.filter((s: any) => s.type === 'D' || s.type == 'E');
      },
      error: (error) => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }
  
  refreshSelectedJobApp() {
    this.jamService.getJobApplication(this.selectedApp.id)
    .subscribe({
      next: (data: any) => {
        this.loading = false;
        this.selectedApp = data;
      },
      error: () => {
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

  getProperDateFromField(field: string) {
    let inputDate = new Date(field);
    return formatDate(inputDate, 'yyyy-MM-dd', 'en_US')
  }

  getProperDisplayDate(date: string) {
    let inputDate = new Date(date);
    return formatDate(inputDate, 'MM/dd/yyyy', 'en_US')
  }
}
