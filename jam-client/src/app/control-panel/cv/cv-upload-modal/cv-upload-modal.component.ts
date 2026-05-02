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
import { JamService } from 'src/app/_services/jam.service';
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
  cvFile: File | null = null;
  uploading: boolean = false;
  errorMessage: string = '';

  get isEditMode(): boolean {
    return this.editCV !== null;
  }

  constructor(private jamService: JamService, private fb: FormBuilder) {
    this.form = this.fb.group({
      cvKey: new FormControl('', [Validators.required]),
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editCV'] && this.editCV) {
      this.form.patchValue({ cvKey: this.editCV.key });
      this.cvFile = null;
      this.errorMessage = '';
    }
  }

  onModalOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close();
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      this.errorMessage = 'Only PDF, DOC, and DOCX files are allowed.';
      event.target.value = '';
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      this.errorMessage = 'File size must not exceed 1MB.';
      event.target.value = '';
      return;
    }

    this.cvFile = file;
    this.errorMessage = '';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'CV name is required.';
      return;
    }

    if (!this.isEditMode && !this.cvFile) {
      this.errorMessage = 'Please select a file.';
      return;
    }

    this.uploading = true;
    this.errorMessage = '';
    const cvKey = this.form.value.cvKey;

    if (this.isEditMode && this.editCV) {
      this.jamService
        .updateCV(this.editCV.id, cvKey, this.cvFile || undefined)
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
      if (!this.cvFile) return;
      this.jamService.createCV(cvKey, this.cvFile).subscribe({
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
    this.cvFile = null;
    this.errorMessage = '';
    this.uploading = false;
    this.editCV = null;
  }
}
