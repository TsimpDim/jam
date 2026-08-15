import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeadPrefillModalComponent } from './lead-prefill-modal.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('LeadPrefillModalComponent', () => {
  let component: LeadPrefillModalComponent;
  let fixture: ComponentFixture<LeadPrefillModalComponent>;

  const mockLead = {
    id: 7,
    company: 'Acme',
    role: 'Engineer',
    location: 'NYC',
    external_link: 'https://acme.com/jobs/1',
    notes: 'Nice opportunity',
    group: 2,
    group_name: 'Health',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeadPrefillModalComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(LeadPrefillModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.open).toBeFalse();
    expect(component.lead).toBeNull();
  });

  it('should render the lead overview', () => {
    component.open = true;
    component.lead = mockLead;
    fixture.detectChanges();
    const modalBody = fixture.nativeElement.querySelector('.modal-body');
    expect(modalBody.textContent).toContain('Acme');
    expect(modalBody.textContent).toContain('Engineer');
    expect(modalBody.textContent).toContain('NYC');
    expect(modalBody.textContent).toContain('https://acme.com/jobs/1');
    expect(modalBody.textContent).toContain('Health');
    expect(modalBody.textContent).toContain('Nice opportunity');
  });

  it('should hide optional overview rows when the lead has no value', () => {
    component.open = true;
    component.lead = { id: 1, company: 'Acme', role: 'Engineer' };
    fixture.detectChanges();
    const modalBody = fixture.nativeElement.querySelector('.modal-body');
    expect(modalBody.textContent).not.toContain('Location');
    expect(modalBody.textContent).not.toContain('External Link');
    expect(modalBody.textContent).not.toContain('Notes');
  });

  describe('confirm', () => {
    it('should emit confirmed event', () => {
      spyOn(component.confirmed, 'emit');
      component.confirm();
      expect(component.confirmed.emit).toHaveBeenCalled();
    });
  });

  describe('decline', () => {
    it('should emit closed event', () => {
      spyOn(component.closed, 'emit');
      component.decline();
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

  it('should render No, thanks and Pre-fill buttons', () => {
    component.open = true;
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll(
      '.modal-footer button',
    );
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toContain('No, thanks');
    expect(buttons[1].textContent).toContain('Pre-fill');
  });
});
