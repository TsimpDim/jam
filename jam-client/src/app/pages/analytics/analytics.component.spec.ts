import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalyticsComponent } from './analytics.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { JamService } from 'src/app/core/api/jam.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

describe('AnalyticsComponent', () => {
  let component: AnalyticsComponent;
  let fixture: ComponentFixture<AnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        {
          provide: JamService,
          useValue: jasmine.createSpyObj('JamService', ['getAnalytics', 'getSankeyData', 'getGroups'], {
            getAnalytics: () => of({}),
            getSankeyData: () => of({}),
            getGroups: () => of([]),
          }),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
