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
});
