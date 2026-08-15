import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobModalComponent } from './job-modal.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { of } from 'rxjs';

describe('JobModalComponent', () => {
  let component: JobModalComponent;
  let fixture: ComponentFixture<JobModalComponent>;
  let jamServiceSpy: jasmine.SpyObj<JamService>;

  beforeEach(async () => {
    jamServiceSpy = jasmine.createSpyObj('JamService', [
      'getGroups', 'getSteps', 'getLeads', 'getCVs',
      'createJobApplication', 'updateJobApplication', 'deleteJobApplication',
    ]);
    jamServiceSpy.getGroups.and.returnValue(of([{ id: 1, name: 'Tech' }]));
    jamServiceSpy.getSteps.and.returnValue(of([{ id: 5, type: 'S', name: 'Applied' }]));
    jamServiceSpy.getLeads.and.returnValue(of([]));
    jamServiceSpy.getCVs.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [JobModalComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        { provide: JamService, useValue: jamServiceSpy },
        { provide: SnackbarService, useValue: jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'getErrorMessage']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have form with company and role fields', () => {
    expect(component.jobAppForm.get('company')).toBeTruthy();
    expect(component.jobAppForm.get('role')).toBeTruthy();
  });

  describe('prefill from lead', () => {
    const openWithPrefill = (prefill: any) => {
      component.application = null;
      component.prefill = prefill;
      component.ngOnChanges({
        isOpen: { previousValue: false, currentValue: true, firstChange: false },
      } as any);
    };

    it('should pre-fill the form when opened with a lead', () => {
      openWithPrefill({
        id: 3,
        company: 'Acme',
        role: 'Engineer',
        location: 'NYC',
        external_link: 'https://acme.com/jobs/1',
        notes: 'Great fit',
        group: null,
      });
      expect(component.jobAppForm.value.company).toBe('Acme');
      expect(component.jobAppForm.value.role).toBe('Engineer');
      expect(component.jobAppForm.value.location).toBe('NYC');
      expect(component.jobAppForm.value.externalLink).toBe('https://acme.com/jobs/1');
      expect(component.jobAppForm.value.notes).toBe('Great fit');
      expect(component.jobAppForm.value.lead).toBe(3);
    });

    it('should use the lead group when provided', () => {
      openWithPrefill({ id: 3, company: 'Acme', role: 'Engineer', group: 2 });
      expect(component.jobAppForm.value.group).toBe(2);
    });

    it('should keep the default group when the lead has no group', () => {
      openWithPrefill({ id: 3, company: 'Acme', role: 'Engineer', group: null });
      expect(component.jobAppForm.value.group).toBe(1);
    });
  });

  describe('lead selection prefill prompt', () => {
    const lead = {
      id: 7,
      company: 'Acme',
      role: 'Engineer',
      location: 'NYC',
      external_link: 'https://acme.com/jobs/1',
      notes: 'Nice opportunity',
      group: 2,
      group_name: 'Health',
    };

    beforeEach(() => {
      component.leads = [lead];
    });

    it('should prompt for prefill when a lead is selected', () => {
      component.jobAppForm.get('lead')?.setValue(7);
      expect(component.leadPrefillPromptOpen).toBeTrue();
      expect(component.pendingLeadForPrefill).toEqual(lead);
    });

    it('should not prompt when the lead is set programmatically by prefill', () => {
      component.applyPrefill({ ...lead });
      expect(component.leadPrefillPromptOpen).toBeFalse();
      expect(component.jobAppForm.value.lead).toBe(7);
    });

    it('should pre-fill the form when the prompt is confirmed', () => {
      component.jobAppForm.get('lead')?.setValue(7);
      component.confirmLeadPrefill();
      expect(component.jobAppForm.value.company).toBe('Acme');
      expect(component.jobAppForm.value.role).toBe('Engineer');
      expect(component.jobAppForm.value.location).toBe('NYC');
      expect(component.jobAppForm.value.externalLink).toBe(
        'https://acme.com/jobs/1',
      );
      expect(component.jobAppForm.value.notes).toBe('Nice opportunity');
      expect(component.jobAppForm.value.group).toBe(2);
      expect(component.leadPrefillPromptOpen).toBeFalse();
      expect(component.pendingLeadForPrefill).toBeNull();
    });

    it('should keep the form unchanged when the prompt is declined', () => {
      component.jobAppForm.patchValue({ company: 'Existing', role: 'Dev' });
      component.jobAppForm.get('lead')?.setValue(7);
      component.closeLeadPrefillPrompt();
      expect(component.jobAppForm.value.company).toBe('Existing');
      expect(component.jobAppForm.value.role).toBe('Dev');
      expect(component.jobAppForm.value.lead).toBe(7);
      expect(component.leadPrefillPromptOpen).toBeFalse();
      expect(component.pendingLeadForPrefill).toBeNull();
    });

    it('should prompt again when a different lead is selected', () => {
      component.jobAppForm.get('lead')?.setValue(7);
      component.closeLeadPrefillPrompt();
      component.leads = [
        ...component.leads,
        { ...lead, id: 8, company: 'Globex' },
      ];
      component.jobAppForm.get('lead')?.setValue(8);
      expect(component.leadPrefillPromptOpen).toBeTrue();
      expect(component.pendingLeadForPrefill?.company).toBe('Globex');
    });

    it('should prompt again when re-selecting a lead after clearing the selection', () => {
      component.jobAppForm.get('lead')?.setValue(7);
      component.closeLeadPrefillPrompt();
      component.jobAppForm.get('lead')?.setValue(null as any);
      component.jobAppForm.get('lead')?.setValue(7);
      expect(component.leadPrefillPromptOpen).toBeTrue();
    });
  });
});
