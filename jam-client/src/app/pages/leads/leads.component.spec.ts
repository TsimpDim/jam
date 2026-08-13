import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadsComponent } from './leads.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { JamService } from 'src/app/core/api/jam.service';
import { SpecialService } from 'src/app/core/api/special.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('LeadsComponent', () => {
  let component: LeadsComponent;
  let fixture: ComponentFixture<LeadsComponent>;
  let jamServiceSpy: jasmine.SpyObj<JamService>;
  let specialServiceSpy: jasmine.SpyObj<SpecialService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockLeads = [
    { id: 1, company: 'Acme Corp', role: 'Engineer', location: 'NYC',
      notes: '', external_link: '', archived: false, generated: false,
      date: '2024-01-01', group: null, applications: [], snapshot: null },
    { id: 2, company: 'Old Corp', role: 'Manager', archived: true,
      generated: false, date: '2024-01-01', applications: [] },
  ];

  const mockGroups = [
    { id: 1, name: 'Tech', position: 0 },
    { id: 2, name: 'Health', position: 1 },
  ];

  beforeEach(async () => {
    jamServiceSpy = jasmine.createSpyObj('JamService', [
      'getLeads', 'getGroups', 'getUserInfo', 'getLeadSnapshot',
      'createLead', 'updateLead', 'deleteLead', 'archiveLead', 'getCVs',
    ]);
    jamServiceSpy.getLeads.and.returnValue(of(mockLeads));
    jamServiceSpy.getGroups.and.returnValue(of(mockGroups));
    jamServiceSpy.getUserInfo.and.returnValue(of({
      pk: 1, username: 'alice', is_premium: false, cv_limit: 1, cv_count: 0,
      file_limit_per_app: 5, lead_gen_limit_per_day: 1, lead_gen_used_today: 0,
      cv_review_limit_per_day: null, cv_review_used_today: 0,
    } as any));
    jamServiceSpy.createLead.and.returnValue(of({}));
    jamServiceSpy.getCVs.and.returnValue(of([]));

    specialServiceSpy = jasmine.createSpyObj('SpecialService', [
      'getLeadGenerationRequests', 'createLeadGenerationRequest',
      'getCoverLetterRequests', 'createCoverLetterRequest',
      'getIndustries', 'getExperienceLevels', 'getRoles', 'getCities',
      'getCountries',
    ]);
    specialServiceSpy.getLeadGenerationRequests.and.returnValue(of([]));
    specialServiceSpy.getCoverLetterRequests.and.returnValue(of([]));
    specialServiceSpy.getIndustries.and.returnValue(of([]));
    specialServiceSpy.getExperienceLevels.and.returnValue(of([]));
    specialServiceSpy.getRoles.and.returnValue(of([]));
    specialServiceSpy.getCities.and.returnValue(of([]));
    specialServiceSpy.getCountries.and.returnValue(of([]));

    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', [
      'showSuccess', 'showError', 'showInfo', 'getErrorMessage',
    ]);
    snackbarServiceSpy.getErrorMessage.and.returnValue('Error occurred');

    await TestBed.configureTestingModule({
      imports: [LeadsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: JamService, useValue: jamServiceSpy },
        { provide: SpecialService, useValue: specialServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load leads on init', () => {
      expect(jamServiceSpy.getLeads).toHaveBeenCalledWith('false');
    });

    it('should load groups on init', () => {
      expect(jamServiceSpy.getGroups).toHaveBeenCalled();
    });

    it('should set viewingArchived to false by default', () => {
      expect(component.viewingArchived).toBeFalse();
    });
  });

  describe('filter - leads archive toggle', () => {
    it('should toggle viewingArchived and reload', () => {
      expect(component.viewingArchived).toBeFalse();
      component.toggleViewMode();
      expect(component.viewingArchived).toBeTrue();
      expect(jamServiceSpy.getLeads).toHaveBeenCalledWith('true');
    });
  });

  describe('confirmation dialog for delete', () => {
    it('should open confirm modal when openDeleteConfirm is called', () => {
      component.openDeleteConfirm(5);
      expect(component.leadToDelete).toBe(5);
      expect(component.confirmModalOpen).toBeTrue();
    });

    it('should call deleteLead on confirmed', () => {
      jamServiceSpy.deleteLead.and.returnValue(of({}));
      component.leadToDelete = 5;
      component.onDeleteConfirmed();
      expect(jamServiceSpy.deleteLead).toHaveBeenCalledWith(5);
    });

    it('should close confirm modal on confirmed', () => {
      jamServiceSpy.deleteLead.and.returnValue(of({}));
      component.confirmModalOpen = true;
      component.leadToDelete = 5;
      component.onDeleteConfirmed();
      expect(component.confirmModalOpen).toBeFalse();
    });

    it('should close confirm modal on cancelled', () => {
      component.confirmModalOpen = true;
      component.leadToDelete = 5;
      component.onDeleteCancelled();
      expect(component.confirmModalOpen).toBeFalse();
      expect(component.leadToDelete).toBeNull();
    });

    it('should show success snackbar on delete', () => {
      jamServiceSpy.deleteLead.and.returnValue(of({}));
      component.leadToDelete = 5;
      component.onDeleteConfirmed();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Lead deleted successfully.');
    });

    it('should show error snackbar on delete failure', () => {
      jamServiceSpy.deleteLead.and.returnValue(throwError(() => new Error('fail')));
      component.leadToDelete = 5;
      component.onDeleteConfirmed();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });
  });

  describe('lead form', () => {
    it('should require company', () => {
      const company = component.leadForm.get('company');
      company?.setValue('');
      expect(company?.valid).toBeFalse();
      company?.setValue('Test Corp');
      expect(company?.valid).toBeTrue();
    });

    it('should require role', () => {
      const role = component.leadForm.get('role');
      role?.setValue('');
      expect(role?.valid).toBeFalse();
      role?.setValue('Engineer');
      expect(role?.valid).toBeTrue();
    });

    it('should not submit invalid form', () => {
      spyOn(component, 'createLead');
      component.submitForm();
      expect(component.createLead).not.toHaveBeenCalled();
    });

    it('should submit valid form with createLead', () => {
      jamServiceSpy.createLead.and.returnValue(of({}));
      component.leadForm.patchValue({ company: 'Test Corp', role: 'Engineer' });
      component.submitForm();
      expect(jamServiceSpy.createLead).toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('should call archiveLead and reload', () => {
      jamServiceSpy.archiveLead.and.returnValue(of({}));
      component.toggleLeadArchive({ id: 1, archived: false });
      expect(jamServiceSpy.archiveLead).toHaveBeenCalledWith(1, true);
    });

    it('should set viewingArchived to false when unarchiving', () => {
      jamServiceSpy.archiveLead.and.returnValue(of({}));
      component.viewingArchived = true;
      component.toggleLeadArchive({ id: 1, archived: true });
      expect(component.viewingArchived).toBeFalse();
    });
  });

  describe('empty state', () => {
    it('should show the create lead button when there are no leads', () => {
      component.leads = [];
      component.loading = false;
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.empty-state .btn'),
      ).toBeTruthy();
    });

    it('should hide the top actions when there are no leads', () => {
      component.leads = [];
      component.loading = false;
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.top-actions'),
      ).toBeNull();
    });

    it('should show the top actions when leads exist', () => {
      component.leads = mockLeads;
      component.loading = false;
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.top-actions'),
      ).toBeTruthy();
    });

    it('should not show the empty state while loading', () => {
      component.leads = [];
      component.loading = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.empty-state')).toBeNull();
    });

    it('should not show the empty state when leads exist', () => {
      component.leads = mockLeads;
      component.loading = false;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.empty-state')).toBeNull();
    });

    it('should open the create lead modal from the empty state button', () => {
      component.leads = [];
      component.loading = false;
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector('.empty-state .btn');
      button.click();
      expect(component.modalIsOpen).toBeTrue();
      expect(component.selectedLead).toBeNull();
    });

    it('should show generate leads below the create lead button', () => {
      component.leads = [];
      component.loading = false;
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        '.empty-state .empty-actions .btn',
      );
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Create Lead');
      expect(buttons[1].textContent).toContain('Generate Leads');
    });

    it('should open the lead generation modal from the empty state button', () => {
      component.leads = [];
      component.loading = false;
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll(
        '.empty-state .empty-actions .btn',
      );
      buttons[1].click();
      expect(component.showLeadGenerationModal).toBeTrue();
    });
  });

  describe('lead modal', () => {
    it('should open modal', () => {
      component.openModal();
      expect(component.modalIsOpen).toBeTrue();
    });

    it('should close modal and clear state', () => {
      component.modalIsOpen = true;
      component.selectedLead = { id: 1 };
      component.closeModal();
      expect(component.modalIsOpen).toBeFalse();
      expect(component.selectedLead).toBeNull();
    });

    it('should clear form and open for new lead', () => {
      component.leadForm.patchValue({ company: 'old' });
      component.clearAndOpenModal();
      expect(component.leadForm.value.company).toBeFalsy();
      expect(component.selectedLead).toBeNull();
      expect(component.modalIsOpen).toBeTrue();
    });
  });
});
