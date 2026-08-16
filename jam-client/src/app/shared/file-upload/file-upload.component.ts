import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { ClarityIcons, trashIcon, uploadCloudIcon, downloadIcon } from '@cds/core/icon';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { JobAppFile } from 'src/app/interfaces';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

ClarityIcons.addIcons(trashIcon, uploadCloudIcon, downloadIcon);

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
  '.txt', '.md', '.rtf', '.odt', '.ods', '.odp',
  '.csv', '.json', '.xml', '.yaml', '.yml',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.zip', '.rar', '.7z',
];
const MAX_FILE_SIZE = 300 * 1024 * 1024;

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, ClarityModule, ConfirmModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
})
export class FileUploadComponent implements OnChanges, AfterViewInit {
  @Input() jobAppId: number | null = null;
  @Input() showDropZone: boolean = true;
  @Input() isPremium: boolean = false;
  @Input() fileLimit: number | null = null;
  @Output() filesChanged = new EventEmitter<void>();
  @Output() filesChange = new EventEmitter<JobAppFile[]>();

  files: JobAppFile[] = [];
  loading = false;
  uploading = false;
  isDragOver = false;
  confirmDeleteOpen = false;
  fileToDelete: JobAppFile | null = null;

  constructor(private jamService: JamService, private snackbarService: SnackbarService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobAppId']) {
      if (this.jobAppId) {
        this.loadFiles();
      } else {
        this.files = [];
        this.filesChange.emit(this.files);
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.jobAppId && this.files.length === 0 && !this.loading) {
      this.loadFiles();
    }
  }

  loadFiles(): void {
    if (!this.jobAppId) return;
    this.loading = true;
    this.jamService.getJobAppFiles(this.jobAppId).subscribe({
      next: (data: JobAppFile[]) => {
        this.files = data;
        this.loading = false;
        this.filesChange.emit(this.files);
      },
      error: () => {
        this.loading = false;
        this.filesChange.emit(this.files);
      },
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.uploadFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.uploadFiles(input.files);
      input.value = '';
    }
  }

  private uploadFiles(fileList: FileList): void {
    if (!this.jobAppId) return;

    if (this.fileLimit != null && this.files.length >= this.fileLimit) {
      this.snackbarService.showError(
        `Limit of ${this.fileLimit} files per application reached.`
      );
      return;
    }

    const allFiles = Array.from(fileList);

    if (this.fileLimit != null) {
      const available = this.fileLimit - this.files.length;
      if (allFiles.length > available) {
        this.snackbarService.showError(
          `Only ${available} more file${available !== 1 ? 's' : ''} can be added (limit ${this.fileLimit}).`
        );
        return;
      }
    }
    const validFiles: File[] = [];
    for (const file of allFiles) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        this.snackbarService.showError(
          `"${file.name}" has an unsupported file type (.${file.name.split('.').pop()}).`
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        this.snackbarService.showError(
          `"${file.name}" exceeds the 300MB size limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`
        );
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    this.uploading = true;
    let completed = 0;

    validFiles.forEach((file) => {
      this.jamService.uploadJobAppFile(this.jobAppId!, file).subscribe({
        next: (uploaded: any) => {
          this.files = [...this.files, uploaded as JobAppFile];
          this.filesChanged.emit();
          this.filesChange.emit(this.files);
          this.snackbarService.showSuccess('File uploaded successfully.');
          this.snackbarService.showInfo(`${this.files.length} of ${this.fileLimit} file slots used.`);
          completed++;
          if (completed === validFiles.length) {
            this.uploading = false;
          }
        },
        error: (err) => {
          if (err?.error?.error) {
            this.snackbarService.showError(err.error.error);
          } else {
            this.snackbarService.showError(`Failed to upload "${file.name}".`);
          }
          completed++;
          if (completed === validFiles.length) {
            this.uploading = false;
          }
        },
      });
    });
  }

  deleteFile(file: JobAppFile, event: Event): void {
    event.stopPropagation();
    this.fileToDelete = file;
    this.confirmDeleteOpen = true;
  }

  onDeleteConfirmed(): void {
    this.confirmDeleteOpen = false;
    if (this.fileToDelete === null) {
      return;
    }
    const file = this.fileToDelete;
    this.fileToDelete = null;
    this.jamService.deleteJobAppFile(file.id).subscribe({
      next: () => {
        this.files = this.files.filter((f) => f.id !== file.id);
        this.filesChanged.emit();
        this.filesChange.emit(this.files);
      },
    });
  }

  onDeleteCancelled(): void {
    this.confirmDeleteOpen = false;
    this.fileToDelete = null;
  }

  downloadFile(file: JobAppFile, event: Event): void {
    event.stopPropagation();
    this.jamService.downloadJobAppFile(file.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        window.URL.revokeObjectURL(url);
      },
    });
  }
}
