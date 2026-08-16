import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileUploadComponent } from './file-upload.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { JobAppFile } from 'src/app/interfaces';
import { of } from 'rxjs';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;
  let jamServiceSpy: jasmine.SpyObj<JamService>;

  const file: JobAppFile = { id: 12, name: 'resume.pdf' } as JobAppFile;

  beforeEach(async () => {
    jamServiceSpy = jasmine.createSpyObj('JamService', [
      'getJobAppFiles',
      'deleteJobAppFile',
    ]);
    jamServiceSpy.getJobAppFiles.and.returnValue(of([file]));
    jamServiceSpy.deleteJobAppFile.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [FileUploadComponent],
      providers: [
        provideNoopAnimations(),
        { provide: JamService, useValue: jamServiceSpy },
        {
          provide: SnackbarService,
          useValue: jasmine.createSpyObj('SnackbarService', [
            'showSuccess',
            'showError',
            'showInfo',
          ]),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('delete confirmation', () => {
    beforeEach(() => {
      component.files = [file];
      component.jobAppId = 1;
    });

    it('should open the confirm dialog instead of deleting immediately', () => {
      component.deleteFile(file, new Event('click'));
      expect(component.confirmDeleteOpen).toBeTrue();
      expect(component.fileToDelete).toEqual(file);
      expect(jamServiceSpy.deleteJobAppFile).not.toHaveBeenCalled();
    });

    it('should delete the file when the delete is confirmed', () => {
      spyOn(component.filesChanged, 'emit');
      spyOn(component.filesChange, 'emit');
      component.fileToDelete = file;
      component.onDeleteConfirmed();
      expect(jamServiceSpy.deleteJobAppFile).toHaveBeenCalledWith(12);
      expect(component.files).toEqual([]);
      expect(component.filesChanged.emit).toHaveBeenCalled();
      expect(component.filesChange.emit).toHaveBeenCalled();
      expect(component.confirmDeleteOpen).toBeFalse();
      expect(component.fileToDelete).toBeNull();
    });

    it('should not delete when the confirmation is cancelled', () => {
      component.fileToDelete = file;
      component.onDeleteCancelled();
      expect(jamServiceSpy.deleteJobAppFile).not.toHaveBeenCalled();
      expect(component.files).toEqual([file]);
      expect(component.confirmDeleteOpen).toBeFalse();
      expect(component.fileToDelete).toBeNull();
    });

    it('should do nothing when confirmed without a pending file', () => {
      component.fileToDelete = null;
      component.onDeleteConfirmed();
      expect(jamServiceSpy.deleteJobAppFile).not.toHaveBeenCalled();
    });
  });
});
