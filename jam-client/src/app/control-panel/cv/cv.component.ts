import { Component, OnInit } from '@angular/core';
import { JamService } from 'src/app/_services/jam.service';
import { CV, UserInfo } from 'src/app/interfaces';

@Component({
  selector: 'app-cv',
  templateUrl: './cv.component.html',
  styleUrls: ['./cv.component.scss'],
})
export class CvComponent implements OnInit {
  cvs: CV[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showErrorAlert: boolean = false;
  showSuccessAlert: boolean = false;

  // Modal state
  showUploadForm: boolean = false;
  editingCV: CV | null = null;

  // User info / quota
  userInfo: UserInfo | null = null;
  cvLimit: number = 1;
  cvCount: number = 0;

  // Download state
  downloadingId: number | null = null;

  constructor(private jamService: JamService) {}

  ngOnInit(): void {
    this.loadCVs();
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    this.jamService.getUserInfo().subscribe({
      next: (data) => {
        this.userInfo = data;
        this.cvLimit = data.cv_limit;
        this.cvCount = data.cv_count;
      },
      error: (error) => {
        console.error('Error loading user info:', error);
      },
    });
  }

  loadCVs(): void {
    this.loading = true;
    this.jamService.getCVs().subscribe({
      next: (data) => {
        this.cvs = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading CVs:', error);
        this.loading = false;
      },
    });
  }

  openUploadForm(): void {
    if (this.cvCount >= this.cvLimit) {
      this.errorMessage = `CV limit reached. Maximum ${this.cvLimit} CV${
        this.cvLimit > 1 ? 's' : ''
      } allowed.`;
      this.showErrorAlert = true;
      return;
    }
    this.editingCV = null;
    this.showUploadForm = true;
  }

  openUpdateForm(cv: CV): void {
    this.editingCV = cv;
    this.showUploadForm = true;
  }

  onCvUploaded(): void {
    this.showUploadForm = false;
    this.successMessage = this.editingCV
      ? 'CV updated successfully.'
      : 'CV uploaded successfully.';
    this.showSuccessAlert = true;
    this.loadCVs();
    this.loadUserInfo();
  }

  onModalClosed(): void {
    this.showUploadForm = false;
    this.editingCV = null;
  }

  deleteCV(cv: CV): void {
    if (!confirm(`Are you sure you want to delete "${cv.key}"?`)) {
      return;
    }

    this.loading = true;
    this.jamService.deleteCV(cv.id).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'CV deleted successfully.';
        this.showSuccessAlert = true;
        this.loadCVs();
        this.loadUserInfo();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'An error occurred while deleting the CV.';
        this.showErrorAlert = true;
      },
    });
  }

  downloadCV(cv: CV): void {
    if (this.downloadingId !== null) return;
    this.downloadingId = cv.id;

    this.jamService.downloadCV(cv.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = this.getFileName(cv.file) || cv.key;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.downloadingId = null;
      },
      error: () => {
        this.errorMessage = 'An error occurred while downloading the CV.';
        this.showErrorAlert = true;
        this.downloadingId = null;
      },
    });
  }

  getFileName(fileUrl: string): string {
    if (!fileUrl) return '';
    return fileUrl.split('/').pop() || '';
  }

  getFileExtension(fileUrl: string): string {
    const fileName = this.getFileName(fileUrl);
    if (!fileName) return '';
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.pop()?.toUpperCase() || '' : '';
  }
}
