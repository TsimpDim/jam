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
  Validators,
} from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { JamService } from 'src/app/core/api/jam.service';
import { CV } from 'src/app/interfaces';

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
  uploading: boolean = false;
  errorMessage: string = '';

  get isEditMode(): boolean {
    return this.editCV !== null;
  }

  constructor(private jamService: JamService, private fb: FormBuilder) {
    this.form = this.fb.group({
      cvKey: new FormControl('', [Validators.required]),
      cvFile: new FormControl(null),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editCV'] && this.editCV) {
      this.form.patchValue({ cvKey: this.editCV.key });
      this.errorMessage = '';
    }
  }

  onModalOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'CV name is required.';
      return;
    }

    const cvFile = this.form.get('cvFile')?.value;
    if (!this.isEditMode && !cvFile) {
      this.errorMessage = 'Please select a file.';
      return;
    }

    if (cvFile) {
      const file = cvFile instanceof FileList ? cvFile[0] : cvFile;
      if (file) {
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
          this.form.get('cvFile')?.setErrors({ invalidFile: 'Only PDF, DOC, and DOCX files are allowed.' });
          return;
        }

        if (file.size > 1 * 1024 * 1024) {
          this.form.get('cvFile')?.setErrors({ invalidFile: 'File size must not exceed 1MB.' });
          return;
        }
      }
    }

    this.uploading = true;
    this.errorMessage = '';
    this.form.get('cvFile')?.setErrors(null);
    const cvKey = this.form.value.cvKey;

    if (this.isEditMode && this.editCV) {
      const file = cvFile instanceof FileList ? cvFile[0] : cvFile;
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
            this.errorMessage = 'An error occurred while updating the CV.';
          },
        });
    } else {
      if (!cvFile) return;
      const file = cvFile instanceof FileList ? cvFile[0] : cvFile;
      this.jamService.createCV(cvKey, file).subscribe({
        next: () => {
          this.uploading = false;
          this.reset();
          this.uploaded.emit();
        },
        error: () => {
          this.uploading = false;
          this.errorMessage = 'An error occurred while uploading the CV.';
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
    this.errorMessage = '';
    this.uploading = false;
    this.editCV = null;
  }
}
