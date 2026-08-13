import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TutorialOverlayComponent } from './tutorial-overlay.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('TutorialOverlayComponent', () => {
  let component: TutorialOverlayComponent;
  let fixture: ComponentFixture<TutorialOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorialOverlayComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose five tutorial steps', () => {
    expect(component.steps.length).toBe(5);
    expect(component.steps[0].target).toBe('empty-state-add-btn');
    expect(component.steps[1].target).toBe('nav-steps');
    expect(component.steps[2].target).toBe('nav-leads');
    expect(component.steps[3].target).toBe('nav-cv');
    expect(component.steps[4].target).toBe('nav-analytics');
  });

  it('should show the tooltip card for every step', () => {
    expect(
      fixture.nativeElement.querySelector('.tutorial-card--tooltip'),
    ).toBeTruthy();
    component.step = 1;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.tutorial-card--tooltip'),
    ).toBeTruthy();
  });

  it('next should emit the following step', () => {
    const emitSpy = spyOn(component.onStepChange, 'emit');
    component.next();
    expect(emitSpy).toHaveBeenCalledWith(1);
  });

  it('next on the last step should emit complete', () => {
    const stepSpy = spyOn(component.onStepChange, 'emit');
    const completeSpy = spyOn(component.onComplete, 'emit');
    component.step = 4;
    component.next();
    expect(stepSpy).not.toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('back should emit the previous step', () => {
    const emitSpy = spyOn(component.onStepChange, 'emit');
    component.step = 2;
    component.back();
    expect(emitSpy).toHaveBeenCalledWith(1);
  });

  it('back on the first step should do nothing', () => {
    const emitSpy = spyOn(component.onStepChange, 'emit');
    component.back();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('skip should emit complete', () => {
    const completeSpy = spyOn(component.onComplete, 'emit');
    component.skip();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('goTo should emit the requested step when different', () => {
    const emitSpy = spyOn(component.onStepChange, 'emit');
    component.goTo(3);
    expect(emitSpy).toHaveBeenCalledWith(3);
    component.step = 3;
    component.goTo(3);
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('goTo should ignore out-of-range steps', () => {
    const emitSpy = spyOn(component.onStepChange, 'emit');
    component.goTo(-1);
    component.goTo(99);
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('isLast should only be true on the last step', () => {
    component.step = 4;
    expect(component.isLast).toBeTrue();
    component.step = 3;
    expect(component.isLast).toBeFalse();
  });
});
