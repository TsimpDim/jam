import { Component, OnInit } from '@angular/core';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {
  public applications: any;
  public loadingTimeline: boolean = true;
  public loadingApplications: boolean = true;
  public loadingSelectedApplication: boolean = false;
  public selectedApp: any = null;
  public jobAppModalIsOpen: boolean = false;
  public selectedAppTimeline: any;
  public timelineStepModalIsOpen: boolean = false;
  public steps: any;
  public nonStartingSteps: any;
  public editTimelineModalIsOpen: boolean = false;
  public selectedTimelineStep: any = null;
  public groupToSelect: any = null;

  constructor (
    private jamService: JamService
  ) {}

  ngOnInit(): void {
    this.getApplications();
    this.getSteps();
  }

  getApplications() {
    this.loadingApplications = true;
    this.loadingSelectedApplication = true;
    this.jamService.getJobApplications(true)
    .subscribe({
      next: (data: any) => {
        this.loadingSelectedApplication = false;
        this.loadingApplications = false;
        this.applications = data;

        if (this.selectedApp !== null) {
          this.selectApp({'groupName':this.selectedApp.group_name, 'jobAppId': this.selectedApp.id});
        }
      },
      error: (error) => {
      }
    })
  }

  selectApp(event: any) {
    let appsOfGroup = this.applications[event.groupName];
    let selectedJobApp = appsOfGroup.find((app: any) => app.id == event.jobAppId);

    if (selectedJobApp !== undefined) {
      this.selectedApp = selectedJobApp;

      this.getTimeline();
    } else {
      this.selectedApp = null;
    }
  }

  getSteps() {
    this.jamService.getSteps()
    .subscribe({
      next: (data) => {
        this.steps = data;
        this.nonStartingSteps = this.steps.filter((s: any) => s.type === 'D' || s.type == 'E');
      }
    })
  }
  
  refreshSelectedJobApp() {
    this.loadingSelectedApplication = true;
    this.jamService.getJobApplication(this.selectedApp.id)
    .subscribe({
      next: (data: any) => {
        this.loadingSelectedApplication = false;
        this.selectedApp = data;
      }
    })
  }

  getTimeline() {
    this.selectedAppTimeline = null;
    this.loadingTimeline = true;
    this.jamService.getTimeline(this.selectedApp.id)
    .subscribe({
      next: (data: any) => {
        this.loadingTimeline = false;
        this.selectedAppTimeline = data;
      },
      error: () => {
        this.loadingTimeline = true;
      }
    })
  }

  openAndClearJobAppModal(emmited: {group: string} | undefined) {
    this.selectedApp = null;
    this.jobAppModalIsOpen = true;
    if (emmited) {
      this.groupToSelect = emmited.group;
    }
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
    this.selectedTimelineStep = this.selectedAppTimeline.find((timelineSteps: any) => timelineSteps.id == timelineStepId);
    this.timelineStepModalIsOpen = true;
  }
}
