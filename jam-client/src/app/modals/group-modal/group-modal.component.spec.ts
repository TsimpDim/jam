import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupModalComponent } from './group-modal.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { of } from 'rxjs';

describe('GroupModalComponent', () => {
  let component: GroupModalComponent;
  let fixture: ComponentFixture<GroupModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupModalComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(withInterceptorsFromDi()),
        { provide: JamService, useValue: jasmine.createSpyObj('JamService', ['createGroup', 'updateGroup', 'deleteGroup']) },
        { provide: SnackbarService, useValue: jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError', 'getErrorMessage']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('delete confirmation', () => {
    let jamServiceSpy: jasmine.SpyObj<JamService>;

    beforeEach(() => {
      jamServiceSpy = TestBed.inject(JamService) as jasmine.SpyObj<JamService>;
      component.group = { id: 4, name: 'Tech', description: '' };
      jamServiceSpy.deleteGroup.and.returnValue(of({}));
    });

    it('should open confirm dialog when openDeleteConfirm is called', () => {
      component.openDeleteConfirm();
      expect(component.confirmDeleteOpen).toBeTrue();
    });

    it('should call deleteGroup only after confirmation', () => {
      component.openDeleteConfirm();
      expect(jamServiceSpy.deleteGroup).not.toHaveBeenCalled();
      component.onDeleteConfirmed();
      expect(jamServiceSpy.deleteGroup).toHaveBeenCalledWith(4);
      expect(component.confirmDeleteOpen).toBeFalse();
    });

    it('should not delete when confirmation is cancelled', () => {
      component.openDeleteConfirm();
      component.onDeleteCancelled();
      expect(jamServiceSpy.deleteGroup).not.toHaveBeenCalled();
      expect(component.confirmDeleteOpen).toBeFalse();
    });
  });
});
