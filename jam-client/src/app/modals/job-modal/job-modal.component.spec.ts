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
    jamServiceSpy.getGroups.and.returnValue(of([]));
    jamServiceSpy.getSteps.and.returnValue(of([]));
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
});
