import {
  Component,
  HostListener,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { JamService } from 'src/app/core/api/jam.service';
import { ClarityIcons, detailsIcon, lightbulbIcon } from '@cds/core/icon';
import { JobNavComponent } from '../../shared/job-nav/job-nav.component';
import { JobModalComponent } from '../../modals/job-modal/job-modal.component';
import { TimelineModalComponent } from '../../modals/timeline-modal/timeline-modal.component';
import { NoteViewModalComponent } from '../../modals/note-view-modal/note-view-modal.component';
ClarityIcons.addIcons(detailsIcon, lightbulbIcon);

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    CommonModule,
    ClarityModule,
    JobNavComponent,
    JobModalComponent,
    TimelineModalComponent,
    NoteViewModalComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
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
  public snapshotModalIsOpen: boolean = false;
  public jobAdSnapshot: any = null;
  public loadingSnapshot: boolean = false;
  public timelineLayout: string = 'horizontal';
  public currentSort: string = 'id';
  public noteViewModalIsOpen: boolean = false;
  public selectedTimelineStepForNotes: any = null;
  public showFullNotes: boolean = false;
  private readonly MAX_JOB_APP_NOTE_LINES = 15;

  constructor(private jamService: JamService) {}

  isNotesLong(notes: string): boolean {
    if (!notes) return false;
    const lines = notes.split('\n').length;
    return lines > this.MAX_JOB_APP_NOTE_LINES;
  }

  getNotesPreview(notes: string): string {
    if (!notes) return '';
    const lines = notes.split('\n');
    const preview = lines.slice(0, this.MAX_JOB_APP_NOTE_LINES).join('\n');
    return preview + '...';
  }

  toggleFullNotes(): void {
    this.showFullNotes = !this.showFullNotes;
  }

  ngOnInit(): void {
    const savedSort = localStorage.getItem('jam_job_nav_sort') || '-id';
    this.currentSort = savedSort;
    this.getApplications();
    this.getSteps();
    this.updateTimelineLayout();
  }

  onSortChange(sort: string) {
    this.currentSort = sort;
    this.getApplications();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateTimelineLayout();
  }

  updateTimelineLayout() {
    this.timelineLayout = window.innerWidth < 768 ? 'vertical' : 'horizontal';
  }

  getApplications() {
    this.loadingApplications = true;
    this.loadingSelectedApplication = true;
    this.jamService.getJobApplications(true, this.currentSort).subscribe({
      next: (data: any) => {
        this.loadingSelectedApplication = false;
        this.loadingApplications = false;
        this.applications = data;

        if (this.selectedApp !== null) {
          this.selectApp({
            groupName: this.selectedApp.group_name,
            jobAppId: this.selectedApp.id,
          });
        }
      },
      error: (error) => {},
    });
  }

  selectApp(event: any) {
    let appsOfGroup = this.applications[event.groupName];
    let selectedJobApp = appsOfGroup.find(
      (app: any) => app.id == event.jobAppId
    );

    if (selectedJobApp !== undefined) {
      this.selectedApp = selectedJobApp;
      this.showFullNotes = false;

      this.getTimeline();
    } else {
      this.selectedApp = null;
    }
  }

  getSteps() {
    this.jamService.getSteps().subscribe({
      next: (data) => {
        this.steps = data;
        this.nonStartingSteps = this.steps.filter(
          (s: any) => s.type === 'D' || s.type == 'E'
        );
      },
    });
  }

  refreshSelectedJobApp() {
    this.loadingSelectedApplication = true;
    this.jamService.getJobApplication(this.selectedApp.id).subscribe({
      next: (data: any) => {
        this.loadingSelectedApplication = false;
        this.selectedApp = data;
      },
    });
  }

  getTimeline() {
    this.selectedAppTimeline = null;
    this.loadingTimeline = true;
    this.jamService.getTimeline(this.selectedApp.id).subscribe({
      next: (data: any) => {
        this.loadingTimeline = false;
        this.selectedAppTimeline = data;
      },
      error: () => {
        this.loadingTimeline = true;
      },
    });
  }

  openAndClearJobAppModal(emmited: { group: string } | undefined) {
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
    this.jobAppModalIsOpen = false;
    this.selectedApp = null;
  }

  onApplicationCreated(app: any) {
    if (this.applications && app.group_name in this.applications) {
      this.applications[app.group_name].unshift(app);
    }
    this.selectedApp = app;
  }

  openTimelineStepModal() {
    this.timelineStepModalIsOpen = true;
    this.selectedTimelineStep = null;
  }

  closeTimelineStepModal() {
    this.timelineStepModalIsOpen = false;
  }

  openEditTimelineModal(timelineStepId: any) {
    this.selectedTimelineStep = this.selectedAppTimeline.find(
      (timelineSteps: any) => timelineSteps.id == timelineStepId
    );
    this.timelineStepModalIsOpen = true;
  }

  openNoteViewModal(timelineStepId: any) {
    if (!this.selectedAppTimeline) {
      return;
    }

    const found = this.selectedAppTimeline.find(
      (timelineSteps: any) => timelineSteps.id == timelineStepId
    );

    if (!found) {
      return;
    }

    this.selectedTimelineStepForNotes = { ...found };
    this.noteViewModalIsOpen = true;
  }

  openSnapshotModal() {
    this.loadingSnapshot = true;
    this.snapshotModalIsOpen = true;
    this.jamService.getJobAdSnapshot(this.selectedApp.id).subscribe({
      next: (data: any) => {
        this.loadingSnapshot = false;
        this.jobAdSnapshot = data;
      },
      error: () => {
        this.loadingSnapshot = false;
        this.jobAdSnapshot = null;
      },
    });
  }

  closeSnapshotModal() {
    this.snapshotModalIsOpen = false;
    this.jobAdSnapshot = null;
  }
}
