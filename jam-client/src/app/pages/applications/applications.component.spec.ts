import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationsComponent } from './applications.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ApplicationsComponent', () => {
  let component: ApplicationsComponent;
  let fixture: ComponentFixture<ApplicationsComponent>;
  let jamServiceSpy: jasmine.SpyObj<JamService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockApplications = {
    'Tech': [{ id: 1, company: 'Google', role: 'Engineer', group_name: 'Tech' }],
  };

  const mockTimeline = [
    { id: 1, step: { name: 'Applied', color: '#0072a3' }, notes: '', date: '2024-01-01' },
  ];

  const mockSteps = [
    { id: 1, name: 'Applied', type: 'S' },
    { id: 2, name: 'Interview', type: 'D' },
    { id: 3, name: 'Offer', type: 'E' },
  ];

  beforeEach(async () => {
    jamServiceSpy = jasmine.createSpyObj('JamService', [
      'getJobApplications', 'getJobApplication', 'getSteps', 'getTimeline',
      'getJobAdSnapshot', 'deleteJobApplication', 'getGroups', 'reorderGroups',
      'getLeads', 'getCVs', 'createGroup', 'updateGroup', 'deleteGroup',
      'createJobApplication', 'updateJobApplication', 'addStepToTimeline',
      'updateTimelineStep', 'deleteTimelineStep', 'getUserInfo',
    ]);
    jamServiceSpy.getJobApplications.and.returnValue(of(mockApplications));
    jamServiceSpy.getSteps.and.returnValue(of(mockSteps));
    jamServiceSpy.getTimeline.and.returnValue(of(mockTimeline));
    jamServiceSpy.getUserInfo.and.returnValue(of({ pk: 1, username: 'alice', is_premium: false, cv_limit: 1, cv_count: 0, file_limit_per_app: 5, lead_gen_limit_per_day: 1, lead_gen_used_today: 0, cv_review_limit_per_day: 1, cv_review_used_today: 0 } as any));
    jamServiceSpy.deleteJobApplication.and.returnValue(of({}));
    jamServiceSpy.getGroups.and.returnValue(of([]));
    jamServiceSpy.getLeads.and.returnValue(of([]));
    jamServiceSpy.getCVs.and.returnValue(of([]));

    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [ApplicationsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([{ path: 'auth/login', component: {} as any }]),
        { provide: JamService, useValue: jamServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load applications on init', () => {
      expect(jamServiceSpy.getJobApplications).toHaveBeenCalledWith(true, '-id');
    });

    it('should load steps on init', () => {
      expect(jamServiceSpy.getSteps).toHaveBeenCalled();
    });
  });

  describe('confirmation dialog on delete', () => {
    it('should open confirm modal on deleteSelectedApplication', () => {
      component.selectedApp = { id: 1 };
      component.deleteSelectedApplication();
      expect(component.confirmModalOpen).toBeTrue();
    });

    it('should delete app on confirmation', () => {
      component.selectedApp = { id: 1, group_name: 'Tech' };
      component.confirmModalOpen = true;
      component.onDeleteConfirmed();
      expect(jamServiceSpy.deleteJobApplication).toHaveBeenCalledWith(1);
    });

    it('should close confirm modal on confirmation', () => {
      component.selectedApp = { id: 1 };
      component.confirmModalOpen = true;
      component.onDeleteConfirmed();
      expect(component.confirmModalOpen).toBeFalse();
    });

    it('should show success snackbar on delete', () => {
      component.selectedApp = { id: 1, group_name: 'Tech' };
      component.onDeleteConfirmed();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Job application deleted successfully.');
    });

    it('should show error snackbar on delete failure', () => {
      jamServiceSpy.deleteJobApplication.and.returnValue(throwError(() => new Error('fail')));
      component.selectedApp = { id: 1 };
      component.onDeleteConfirmed();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should close confirm modal on cancel', () => {
      component.confirmModalOpen = true;
      component.onDeleteCancelled();
      expect(component.confirmModalOpen).toBeFalse();
    });
  });

  describe('sort', () => {
    it('should update sort and reload applications', () => {
      component.onSortChange('id');
      expect(component.currentSort).toBe('id');
      expect(jamServiceSpy.getJobApplications).toHaveBeenCalledWith(true, 'id');
    });
  });

  describe('select app', () => {
    it('should select application and load timeline', () => {
      component.applications = mockApplications;
      component.selectApp({ groupName: 'Tech', jobAppId: 1 });
      expect(component.selectedApp).toBeTruthy();
      expect(jamServiceSpy.getTimeline).toHaveBeenCalledWith(1);
    });
  });

  describe('notes', () => {
    it('isNotesLong should return false for short notes', () => {
      expect(component.isNotesLong('Short note')).toBeFalse();
    });

    it('isNotesLong should return true for long notes', () => {
      const longNote = Array(20).fill('line').join('\n');
      expect(component.isNotesLong(longNote)).toBeTrue();
    });

    it('getNotesPreview should truncate long notes', () => {
      const longNote = Array(20).fill('line').join('\n');
      const preview = component.getNotesPreview(longNote);
      expect(preview.endsWith('...')).toBeTrue();
    });

    it('getNotesPreview should return empty string for null', () => {
      expect(component.getNotesPreview('')).toBe('');
    });

    it('toggleFullNotes should toggle', () => {
      component.toggleFullNotes();
      expect(component.showFullNotes).toBeTrue();
      component.toggleFullNotes();
      expect(component.showFullNotes).toBeFalse();
    });
  });

  describe('modals', () => {
    it('should open job app modal', () => {
      component.openJobAppModal();
      expect(component.jobAppModalIsOpen).toBeTrue();
    });

    it('should close and clear job app modal', () => {
      component.jobAppModalIsOpen = true;
      component.selectedApp = { id: 1 };
      component.closeAndClearJobAppModal();
      expect(component.jobAppModalIsOpen).toBeFalse();
      expect(component.selectedApp).toBeNull();
    });
  });

  describe('empty state', () => {
    it('hasApplications should be true when a group has applications', () => {
      component.applications = mockApplications;
      expect(component.hasApplications).toBeTrue();
    });

    it('hasApplications should be false when there are no applications', () => {
      component.applications = {};
      expect(component.hasApplications).toBeFalse();
    });

    it('hasApplications should be false when applications is null', () => {
      component.applications = null;
      expect(component.hasApplications).toBeFalse();
    });

    it('should show the add application button when there are no applications', () => {
      component.applications = {};
      component.loadingApplications = false;
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('#empty-state-add-btn'),
      ).toBeTruthy();
    });

    it('should open the job app modal when the add button is clicked', () => {
      component.applications = {};
      component.loadingApplications = false;
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector(
        '#empty-state-add-btn',
      );
      button.click();
      expect(component.jobAppModalIsOpen).toBeTrue();
    });
  });

  describe('tutorial', () => {
    beforeEach(() => {
      localStorage.removeItem('showTutorial');
      component.tutorialActive = false;
      component.tutorialStep = 0;
    });

    it('should start the tutorial when there are no applications', () => {
      jamServiceSpy.getJobApplications.and.returnValue(of({}));
      component.getApplications();
      expect(component.tutorialActive).toBeTrue();
      expect(component.tutorialStep).toBe(0);
    });

    it('should not start the tutorial when applications exist', () => {
      component.getApplications();
      expect(component.tutorialActive).toBeFalse();
    });

    it('should not start the tutorial when showTutorial is set', () => {
      localStorage.setItem('showTutorial', 'false');
      jamServiceSpy.getJobApplications.and.returnValue(of({}));
      component.getApplications();
      expect(component.tutorialActive).toBeFalse();
    });

    it('should not restart the tutorial once it is active', () => {
      jamServiceSpy.getJobApplications.and.returnValue(of({}));
      component.getApplications();
      expect(component.tutorialActive).toBeTrue();
      component.tutorialStep = 2;
      component.getApplications();
      expect(component.tutorialActive).toBeTrue();
      expect(component.tutorialStep).toBe(2);
    });

    it('completeTutorial should persist the flag and hide the tutorial', () => {
      component.tutorialActive = true;
      component.tutorialStep = 2;
      component.completeTutorial();
      expect(localStorage.getItem('showTutorial')).toBe('false');
      expect(component.tutorialActive).toBeFalse();
      expect(component.tutorialStep).toBe(0);
    });

    it('onTutorialStepChange should update the current step', () => {
      component.onTutorialStepChange(3);
      expect(component.tutorialStep).toBe(3);
    });

    it('onApplicationCreated should advance to the steps highlight', () => {
      component.tutorialActive = true;
      component.applications = { Tech: [] };
      component.onApplicationCreated({
        id: 1,
        company: 'Google',
        group_name: 'Tech',
      });
      expect(component.tutorialStep).toBe(1);
    });

    it('onApplicationCreated should not advance when tutorial is inactive', () => {
      component.applications = { Tech: [] };
      component.onApplicationCreated({
        id: 1,
        company: 'Google',
        group_name: 'Tech',
      });
      expect(component.tutorialStep).toBe(0);
    });
  });
});
