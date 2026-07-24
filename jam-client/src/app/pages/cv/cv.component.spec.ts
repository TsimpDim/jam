import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CvComponent } from './cv.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { JamService } from 'src/app/core/api/jam.service';
import { SpecialService } from 'src/app/core/api/special.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CvComponent', () => {
  let component: CvComponent;
  let fixture: ComponentFixture<CvComponent>;
  let jamServiceSpy: jasmine.SpyObj<JamService>;

  beforeEach(async () => {
    jamServiceSpy = jasmine.createSpyObj('JamService', ['getCVs', 'deleteCV', 'downloadCV', 'getUserInfo']);
    jamServiceSpy.getCVs.and.returnValue(of([]));
    jamServiceSpy.getUserInfo.and.returnValue(of({ pk: 1, username: 'alice', is_premium: false, cv_limit: 1, cv_count: 0, file_limit_per_app: 5, lead_gen_limit_per_day: null, lead_gen_used_today: 0, cv_review_limit_per_day: null, cv_review_used_today: 0 } as any));

    const specialSpy = jasmine.createSpyObj('SpecialService', [
      'getCVReviews', 'getIndustries', 'getExperienceLevels', 'getRoles',
    ]);
    specialSpy.getIndustries.and.returnValue(of([]));
    specialSpy.getExperienceLevels.and.returnValue(of([]));
    specialSpy.getRoles.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CvComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        { provide: JamService, useValue: jamServiceSpy },
        { provide: SpecialService, useValue: specialSpy },
        { provide: SnackbarService, useValue: jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
