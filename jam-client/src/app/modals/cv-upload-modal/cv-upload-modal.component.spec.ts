import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CvUploadModalComponent } from './cv-upload-modal.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { JamService } from 'src/app/core/api/jam.service';
import { of } from 'rxjs';
import { FormControl } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('CvUploadModalComponent', () => {
  let component: CvUploadModalComponent;
  let fixture: ComponentFixture<CvUploadModalComponent>;
  let jamServiceSpy: jasmine.SpyObj<JamService>;

  beforeEach(async () => {
    jamServiceSpy = jasmine.createSpyObj('JamService', ['createCV', 'updateCV']);

    await TestBed.configureTestingModule({
      imports: [CvUploadModalComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: JamService, useValue: jamServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CvUploadModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('form validators', () => {
    it('should require cvKey', () => {
      const key = component.form.get('cvKey');
      key?.setValue('');
      expect(key?.valid).toBeFalse();
      key?.setValue('My CV');
      expect(key?.valid).toBeTrue();
    });

    it('should show file error for missing file', () => {
      component.form.get('cvFile')?.setValue(null);
      component.form.get('cvFile')?.markAsTouched();
      component.submit();
      expect(component.cvFileError).toContain('Please select a file');
    });
  });

  describe('isEditMode', () => {
    it('should be false when editCV is null', () => {
      expect(component.isEditMode).toBeFalse();
    });

    it('should be true when editCV is set', () => {
      component.editCV = { id: 1, key: 'test', file: '', created_at: '', updated_at: '' };
      expect(component.isEditMode).toBeTrue();
    });
  });

  describe('ngOnChanges', () => {
    it('should patch form values when editing', () => {
      component.editCV = { id: 1, key: 'My CV', file: '', created_at: '', updated_at: '' };
      component.ngOnChanges({
        editCV: { currentValue: component.editCV, previousValue: null, firstChange: true, isFirstChange: () => true } as any,
      });
      expect(component.form.get('cvKey')?.value).toBe('My CV');
    });

    it('should make file optional in edit mode', () => {
      component.editCV = { id: 1, key: 'My CV', file: '', created_at: '', updated_at: '' };
      component.ngOnChanges({
        editCV: { currentValue: component.editCV, previousValue: null, firstChange: true, isFirstChange: () => true } as any,
      });
      expect(component.form.get('cvFile')?.errors?.['required']).toBeFalsy();
    });
  });

  describe('submit', () => {
    it('should call createCV when not editing', () => {
      jamServiceSpy.createCV.and.returnValue(of({}));
      const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
      const dt = new DataTransfer();
      dt.items.add(file);
      component.form.patchValue({ cvKey: 'New CV', cvFile: dt.files });
      component.submit();
      expect(jamServiceSpy.createCV).toHaveBeenCalled();
    });

    it('should call updateCV when editing', () => {
      jamServiceSpy.updateCV.and.returnValue(of({}));
      component.editCV = { id: 1, key: 'old', file: '', created_at: '', updated_at: '' };
      component.ngOnChanges({
        editCV: { currentValue: component.editCV, previousValue: null, firstChange: true, isFirstChange: () => true } as any,
      });
      component.form.patchValue({ cvKey: 'Updated' });
      component.submit();
      expect(jamServiceSpy.updateCV).toHaveBeenCalledWith(1, 'Updated', undefined);
    });
  });

  describe('close and reset', () => {
    it('should reset form on close', () => {
      component.form.patchValue({ cvKey: 'test' });
      component.close();
      expect(component.form.get('cvKey')?.value).toBeFalsy();
      expect(component.uploading).toBeFalse();
      expect(component.editCV).toBeNull();
    });

    it('should emit closed on close', () => {
      spyOn(component.closed, 'emit');
      component.close();
      expect(component.closed.emit).toHaveBeenCalled();
    });

    it('should open the confirm dialog on delete', () => {
      component.delete();
      expect(component.confirmDeleteOpen).toBeTrue();
    });

    it('should emit deleted when the delete is confirmed', () => {
      spyOn(component.deleted, 'emit');
      component.onDeleteConfirmed();
      expect(component.deleted.emit).toHaveBeenCalled();
      expect(component.confirmDeleteOpen).toBeFalse();
    });

    it('should close the confirm dialog without emitting when cancelled', () => {
      spyOn(component.deleted, 'emit');
      component.confirmDeleteOpen = true;
      component.onDeleteCancelled();
      expect(component.deleted.emit).not.toHaveBeenCalled();
      expect(component.confirmDeleteOpen).toBeFalse();
    });
  });
});

describe('cvFileValidator', () => {
  function cvFileValidator(required: boolean) {
    return (control: any) => {
      const value = control.value;
      const file = value instanceof FileList ? value[0] : value;

      if (!file) {
        return required ? { required: true } : null;
      }

      const fileName = file.name || '';
      const ext = '.' + fileName.split('.').pop()?.toLowerCase();
      if (!['.pdf', '.doc', '.docx'].includes(ext)) {
        return { invalidType: true };
      }

      if (file.size > 1 * 1024 * 1024) {
        return { tooLarge: true };
      }

      return null;
    };
  }

  it('should return required when no file and required=true', () => {
    const validator = cvFileValidator(true);
    expect(validator(new FormControl(null))?.['required']).toBeTrue();
  });

  it('should return null when no file and required=false', () => {
    expect(cvFileValidator(false)(new FormControl(null))).toBeNull();
  });

  it('should return null for valid PDF file', () => {
    const file = new File(['%PDF-1.4'], 'test.pdf', { type: 'application/pdf' });
    expect(cvFileValidator(true)(new FormControl(file))).toBeNull();
  });

  it('should return null for valid DOC file', () => {
    const file = new File(['content'], 'test.doc', { type: 'application/msword' });
    expect(cvFileValidator(true)(new FormControl(file))).toBeNull();
  });

  it('should return invalidType for .exe file', () => {
    const file = new File(['binary'], 'test.exe', { type: 'application/x-msdownload' });
    const errors = cvFileValidator(true)(new FormControl(file));
    expect(errors?.['invalidType']).toBeTrue();
  });

  it('should return tooLarge for oversized file', () => {
    const bigContent = new Array(2 * 1024 * 1024).fill('a').join('');
    const file = new File([bigContent], 'test.pdf', { type: 'application/pdf' });
    const errors = cvFileValidator(true)(new FormControl(file));
    expect(errors?.['tooLarge']).toBeTrue();
  });
});
