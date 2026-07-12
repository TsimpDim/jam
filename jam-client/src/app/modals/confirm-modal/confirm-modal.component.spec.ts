import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmModalComponent } from './confirm-modal.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmModalComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.open).toBeFalse();
    expect(component.title).toBe('Confirm');
    expect(component.message).toBe('Are you sure?');
    expect(component.verb).toBe('Submit');
  });

  it('should open when open input is true', () => {
    component.open = true;
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('clr-modal');
    expect(modal).toBeTruthy();
  });

  describe('confirm', () => {
    it('should emit confirmed event', () => {
      spyOn(component.confirmed, 'emit');
      component.confirm();
      expect(component.confirmed.emit).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should emit closed event', () => {
      spyOn(component.closed, 'emit');
      component.cancel();
      expect(component.closed.emit).toHaveBeenCalled();
    });
  });

  describe('onModalOpenChange', () => {
    it('should emit closed when modal is closed via backdrop/ESC', () => {
      spyOn(component.closed, 'emit');
      component.onModalOpenChange(false);
      expect(component.closed.emit).toHaveBeenCalled();
    });

    it('should not emit closed when modal opens', () => {
      spyOn(component.closed, 'emit');
      component.onModalOpenChange(true);
      expect(component.closed.emit).not.toHaveBeenCalled();
    });
  });

  it('should show the correct title and message', () => {
    component.title = 'Delete Item';
    component.message = 'Are you sure you want to delete?';
    component.verb = 'Delete';
    component.open = true;
    fixture.detectChanges();
    const modalTitle = fixture.nativeElement.querySelector('.modal-title');
    const modalBody = fixture.nativeElement.querySelector('.modal-body p');
    expect(modalTitle.textContent).toContain('Delete Item');
    expect(modalBody.textContent).toContain('Are you sure you want to delete?');
  });

  it('should render Cancel and Delete buttons', () => {
    component.open = true;
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.modal-footer button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('Cancel');
    expect(buttons[1].textContent).toContain('Submit');
  });
});
