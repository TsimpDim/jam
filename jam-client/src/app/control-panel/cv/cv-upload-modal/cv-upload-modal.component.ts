import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { JamService } from 'src/app/_services/jam.service';
import { CV } from 'src/app/interfaces';

@Component({
  selector: 'app-cv-upload-modal',
  templateUrl: './cv-upload-modal.component.html',
  styleUrls: ['./cv-upload-modal.component.scss'],
})
export class CvUploadModalComponent implements OnChanges {
  @Input() open: boolean = false;
  @Input() editCV: CV | null = null;
  @Output() uploaded = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  cvKey: string = '';
  cvFile: File | null = null;
  uploading: boolean = false;
  errorMessage: string = '';

  get isEditMode(): boolean {
    return this.editCV !== null;
  }

  constructor(private jamService: JamService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editCV'] && this.editCV) {
      this.cvKey = this.editCV.key;
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
    if (!this.cvKey.trim()) {
      this.errorMessage = 'CV name is required.';
      return;
    }

    if (!this.isEditMode && !this.cvFile) {
      this.errorMessage = 'Please select a file.';
      return;
    }

    this.uploading = true;
    this.errorMessage = '';

    if (this.isEditMode && this.editCV) {
      this.jamService
        .updateCV(this.editCV.id, this.cvKey, this.cvFile || undefined)
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
      this.jamService.createCV(this.cvKey, this.cvFile).subscribe({
        next: () => {
          this.uploading = false;
          this.reset();
          this.uploaded.emit();
        },
        error: (error) => {
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
    this.cvKey = '';
    this.cvFile = null;
    this.errorMessage = '';
    this.uploading = false;
    this.editCV = null;
  }
}
