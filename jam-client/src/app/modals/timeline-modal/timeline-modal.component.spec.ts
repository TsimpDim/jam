import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimelineModalComponent } from './timeline-modal.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { of } from 'rxjs';

describe('TimelineModalComponent', () => {
  let component: TimelineModalComponent;
  let fixture: ComponentFixture<TimelineModalComponent>;
  let jamServiceSpy: jasmine.SpyObj<JamService>;

  beforeEach(async () => {
    jamServiceSpy = jasmine.createSpyObj('JamService', [
      'addStepToTimeline', 'updateTimelineStep', 'deleteTimelineStep',
      'getSteps', 'getTimeline',
    ]);
    jamServiceSpy.getSteps.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TimelineModalComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        { provide: JamService, useValue: jamServiceSpy },
        { provide: SnackbarService, useValue: jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'getErrorMessage']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('delete confirmation', () => {
    beforeEach(() => {
      component.timelineStep = { id: 3, step: { name: 'Interview', type: 'M' } };
      jamServiceSpy.deleteTimelineStep.and.returnValue(of({}));
    });

    it('should open confirm dialog when openDeleteConfirm is called', () => {
      component.openDeleteConfirm();
      expect(component.confirmDeleteOpen).toBeTrue();
    });

    it('should call deleteTimelineStep only after confirmation', () => {
      component.openDeleteConfirm();
      expect(jamServiceSpy.deleteTimelineStep).not.toHaveBeenCalled();
      component.onDeleteConfirmed();
      expect(jamServiceSpy.deleteTimelineStep).toHaveBeenCalledWith(3);
      expect(component.confirmDeleteOpen).toBeFalse();
    });

    it('should not delete when confirmation is cancelled', () => {
      component.openDeleteConfirm();
      component.onDeleteCancelled();
      expect(jamServiceSpy.deleteTimelineStep).not.toHaveBeenCalled();
      expect(component.confirmDeleteOpen).toBeFalse();
    });
  });
});
