import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelineModalComponent } from './timeline-modal.component';

describe('TimelineModalComponent', () => {
  let component: TimelineModalComponent;
  let fixture: ComponentFixture<TimelineModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimelineModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TimelineModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
