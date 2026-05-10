import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { JamService } from 'src/app/core/api/jam.service';
import { CV } from 'src/app/interfaces';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 1 * 1024 * 1024;

function cvFileValidator(required: boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    const file = value instanceof FileList ? value[0] : value;

    if (!file) {
      return required ? { required: true } : null;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { invalidType: true };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { tooLarge: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-cv-upload-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClarityModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './cv-upload-modal.component.html',
  styleUrls: ['./cv-upload-modal.component.scss'],
})
export class CvUploadModalComponent implements OnChanges {
  @Input() open: boolean = false;
  @Input() editCV: CV | null = null;
  @Output() uploaded = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  form: FormGroup;
  uploading = false;
  cvFileError = '';

  get isEditMode(): boolean {
    return this.editCV !== null;
  }

  constructor(private jamService: JamService, private fb: FormBuilder) {
    this.form = this.fb.group({
      cvKey: new FormControl('', [Validators.required]),
      cvFile: new FormControl(null, [cvFileValidator(true)]),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editCV'] && this.editCV) {
      this.form.patchValue({ cvKey: this.editCV.key });
      this.form.get('cvFile')!.setValidators([cvFileValidator(false)]);
      this.form.get('cvFile')!.updateValueAndValidity();
    }
  }

  onModalOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close();
    }
  }

  submit(): void {
    this.cvFileError = '';

    const cvFileControl = this.form.get('cvFile')!;
    const errors = cvFileControl.errors;

    if (errors?.['required']) {
      this.cvFileError = 'Please select a file.';
    } else if (errors?.['invalidType']) {
      this.cvFileError = 'Only PDF, DOC, and DOCX files are allowed.';
    } else if (errors?.['tooLarge']) {
      this.cvFileError = 'File size must not exceed 1MB.';
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const cvKey = this.form.get('cvKey')!.value;
    const cvFileValue = cvFileControl.value;
    const file = cvFileValue instanceof FileList ? cvFileValue[0] : cvFileValue;

    this.uploading = true;

    if (this.isEditMode && this.editCV) {
      this.jamService
        .updateCV(this.editCV.id, cvKey, file || undefined)
        .subscribe({
          next: () => {
            this.uploading = false;
            this.reset();
            this.uploaded.emit();
          },
          error: () => {
            this.uploading = false;
          },
        });
    } else {
      this.jamService.createCV(cvKey, file).subscribe({
        next: () => {
          this.uploading = false;
          this.reset();
          this.uploaded.emit();
        },
        error: () => {
          this.uploading = false;
        },
      });
    }
  }

  close(): void {
    this.reset();
    this.closed.emit();
  }

  private reset(): void {
    this.form.reset();
    this.form.get('cvFile')!.setValidators([cvFileValidator(true)]);
    this.form.get('cvFile')!.updateValueAndValidity();
    this.uploading = false;
    this.editCV = null;
    this.cvFileError = '';
  }
}
