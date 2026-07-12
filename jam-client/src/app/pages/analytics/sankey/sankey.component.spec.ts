import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SankeyComponent } from './sankey.component';
import { JamService } from 'src/app/core/api/jam.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('SankeyComponent', () => {
  let component: SankeyComponent;
  let fixture: ComponentFixture<SankeyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SankeyComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideNoopAnimations(),
        {
          provide: JamService,
          useValue: jasmine.createSpyObj('JamService', ['getSankeyData'], {
            getSankeyData: () => of({ nodes: [], links: [] }),
          }),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SankeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
