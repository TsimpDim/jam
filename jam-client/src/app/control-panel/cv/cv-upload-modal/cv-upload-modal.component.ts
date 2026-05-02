import { Component, EventEmitter, Input, Output } from '@angular/core';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-cv-upload-modal',
  templateUrl: './cv-upload-modal.component.html',
  styleUrls: ['./cv-upload-modal.component.scss'],
})
export class CvUploadModalComponent {
  @Input() open: boolean = false;
  @Output() uploaded = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  cvKey: string = '';
  cvFile: File | null = null;
  uploading: boolean = false;
  errorMessage: string = '';

  constructor(private jamService: JamService) {}

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
    if (!this.cvKey.trim()) {
      this.errorMessage = 'CV name is required.';
      return;
    }
    if (!this.cvFile) {
      this.errorMessage = 'Please select a file.';
      return;
    }

    this.uploading = true;
    this.errorMessage = '';

    this.jamService.createCV(this.cvKey, this.cvFile).subscribe({
      next: () => {
        this.uploading = false;
        this.reset();
        this.uploaded.emit();
      },
      error: (error) => {
        this.uploading = false;
        if (error.error && error.error.error) {
          this.errorMessage = error.error.error;
        } else {
          this.errorMessage = 'An error occurred while uploading the CV.';
        }
      },
    });
  }

  close(): void {
    this.reset();
    this.closed.emit();
  }

  private reset(): void {
    this.cvKey = '';
    this.cvFile = null;
    this.errorMessage = '';
    this.uploading = false;
  }
}
