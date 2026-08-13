import {
  Component,
  HostListener,
  OnInit,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { ClarityIcons, detailsIcon, lightbulbIcon } from '@cds/core/icon';
import { JobNavComponent } from '../../shared/job-nav/job-nav.component';
import { JobModalComponent } from '../../modals/job-modal/job-modal.component';
import { TimelineModalComponent } from '../../modals/timeline-modal/timeline-modal.component';
import { NoteViewModalComponent } from '../../modals/note-view-modal/note-view-modal.component';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';
import { FileUploadComponent } from '../../shared/file-upload/file-upload.component';
import { TutorialOverlayComponent } from '../../shared/tutorial-overlay/tutorial-overlay.component';
ClarityIcons.addIcons(detailsIcon, lightbulbIcon);

const SHOW_TUTORIAL_STORAGE_KEY = 'showTutorial';

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
    ConfirmModalComponent,
    FileUploadComponent,
    TutorialOverlayComponent,
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
  public confirmModalOpen: boolean = false;
  public timelineLayout: string = 'horizontal';
  public currentSort: string = 'id';
  public noteViewModalIsOpen: boolean = false;
  public selectedTimelineStepForNotes: any = null;
  public showFullNotes: boolean = false;
  public isPremium: boolean = false;
  public fileLimit: number | null = null;
  public tutorialActive: boolean = false;
  public tutorialStep: number = 0;
  private readonly MAX_JOB_APP_NOTE_LINES = 15;

  @ViewChild('detailFileUpload') detailFileUpload!: FileUploadComponent;

  constructor(private jamService: JamService, private snackbarService: SnackbarService) {}

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
    this.loadUserInfo();
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

  loadUserInfo() {
    this.jamService.getUserInfo().subscribe({
      next: (data) => {
        this.isPremium = data.is_premium;
        this.fileLimit = data.file_limit_per_app;
      },
    });
  }

  getApplications() {
    this.loadingApplications = true;
    this.loadingSelectedApplication = true;
    this.jamService.getJobApplications(true, this.currentSort).subscribe({
      next: (data: any) => {
        this.loadingSelectedApplication = false;
        this.loadingApplications = false;
        this.applications = data;
        this.maybeStartTutorial();

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

  get hasApplications(): boolean {
    return Object.values(this.applications || {}).some(
      (apps: any) => Array.isArray(apps) && apps.length > 0,
    );
  }

  maybeStartTutorial() {
    if (localStorage.getItem(SHOW_TUTORIAL_STORAGE_KEY) !== null) {
      return;
    }
    if (this.tutorialActive) {
      return;
    }

    if (!this.hasApplications) {
      this.tutorialActive = true;
      this.tutorialStep = 0;
    }
  }

  onTutorialStepChange(step: number) {
    this.tutorialStep = step;
  }

  completeTutorial() {
    localStorage.setItem(SHOW_TUTORIAL_STORAGE_KEY, 'false');
    this.tutorialActive = false;
    this.tutorialStep = 0;
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

  onJobAppModalClose() {
    this.jobAppModalIsOpen = false;
    this.detailFileUpload?.loadFiles();
  }

  onApplicationCreated(app: any) {
    if (this.applications && app.group_name in this.applications) {
      this.applications[app.group_name].unshift(app);
    } else if (this.applications) {
      this.applications[app.group_name] = [app];
    }
    this.selectedApp = app;
    if (this.tutorialActive) {
      this.tutorialStep = 1;
    }
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

  deleteSelectedApplication() {
    this.confirmModalOpen = true;
  }

  onDeleteConfirmed() {
    this.confirmModalOpen = false;
    this.loadingSelectedApplication = true;
    this.jamService.deleteJobApplication(this.selectedApp.id).subscribe({
      next: () => {
        this.snackbarService.showSuccess('Job application deleted successfully.');
        this.selectedApp = null;
        this.loadingSelectedApplication = false;
        this.getApplications();
      },
      error: () => {
        this.loadingSelectedApplication = false;
        this.snackbarService.showError(
          'An error occurred while deleting the job application.',
        );
      },
    });
  }

  onDeleteCancelled() {
    this.confirmModalOpen = false;
  }
}
