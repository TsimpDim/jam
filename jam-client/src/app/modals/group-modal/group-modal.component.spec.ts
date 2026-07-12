import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupModalComponent } from './group-modal.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';

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
});
