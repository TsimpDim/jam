import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { JamService } from 'src/app/core/api/jam.service';
import { SpecialService } from 'src/app/core/api/special.service';
import { CV, CVReview, UserInfo } from 'src/app/interfaces';
import { CvUploadModalComponent } from '../../modals/cv-upload-modal/cv-upload-modal.component';
import { CVReviewModalComponent } from '../../modals/cv-review-request-modal/cv-review-request-modal.component';
import { CvReviewResultModalComponent } from '../../modals/cv-review-result-modal/cv-review-result-modal.component';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';
import { SnackbarService } from '../../core/services/snackbar.service';

@Component({
  selector: 'app-cv',
  standalone: true,
  imports: [
    CommonModule,
    ClarityModule,
    CvUploadModalComponent,
    CVReviewModalComponent,
    CvReviewResultModalComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './cv.component.html',
  styleUrls: ['./cv.component.scss'],
})
export class CvComponent implements OnInit {
  cvs: CV[] = [];
  loading: boolean = false;
  errorMessage: string = '';
  showErrorAlert: boolean = false;

  // Modal state
  showUploadForm: boolean = false;
  editingCV: CV | null = null;
  showReviewRequestModal: boolean = false;
  showReviewResultModal: boolean = false;
  selectedReviewForView: CVReview | null = null;

  // User info / quota
  userInfo: UserInfo | null = null;
  cvLimit: number = 1;
  cvCount: number = 0;

  // Download state
  downloadingId: number | null = null;

  // CV Review state
  cvReviews: Map<number, CVReview[]> = new Map();
  requestingReviewCvId: number | null = null;
  confirmModalOpen: boolean = false;
  cvToDelete: CV | null = null;

  constructor(
    private jamService: JamService,
    private specialService: SpecialService,
    private snackbarService: SnackbarService
  ) {}

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
        for (const cv of this.cvs) {
          this.loadReviewsForCV(cv.id);
        }
      },
      error: (error) => {
        console.error('Error loading CVs:', error);
        this.loading = false;
      },
    });
  }

  loadReviewsForCV(cvId: number): void {
    this.specialService.getCVReviews(cvId).subscribe({
      next: (reviews) => {
        this.cvReviews.set(cvId, reviews);
      },
      error: (error) => {
        console.error('Error loading reviews for CV:', error);
      },
    });
  }

  getCompletedReviewForCV(cvId: number): CVReview | null {
    const reviews = this.cvReviews.get(cvId) || [];
    return reviews.find((r) => r.is_done) || null;
  }

  isCVReviewProcessing(cvId: number): boolean {
    const reviews = this.cvReviews.get(cvId) || [];
    return (reviews.find((r) => !r.is_done) || null) !== null;
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
    this.snackbarService.showSuccess(
      this.editingCV ? 'CV updated successfully.' : 'CV uploaded successfully.'
    );
    this.loadCVs();
    this.loadUserInfo();
  }

  onModalClosed(): void {
    this.showUploadForm = false;
    this.editingCV = null;
  }

  onCvDeleted(): void {
    if (!this.editingCV) return;

    const cv = this.editingCV;

    this.showUploadForm = false;
    this.editingCV = null;
    this.loading = true;

    this.jamService.deleteCV(cv.id).subscribe({
      next: () => {
        this.loading = false;
        this.snackbarService.showSuccess('CV deleted successfully.');
        this.loadCVs();
        this.loadUserInfo();
      },
      error: () => {
        this.loading = false;
        this.snackbarService.showError(
          'An error occurred while deleting the CV.'
        );
      },
    });
  }

  openDeleteConfirm(cv: CV) {
    this.cvToDelete = cv;
    this.confirmModalOpen = true;
  }

  onDeleteConfirmed() {
    if (this.cvToDelete !== null) {
      this.deleteCV(this.cvToDelete);
    }
    this.confirmModalOpen = false;
    this.cvToDelete = null;
  }

  onDeleteCancelled() {
    this.confirmModalOpen = false;
    this.cvToDelete = null;
  }

  deleteCV(cv: CV): void {
    this.loading = true;
    this.jamService.deleteCV(cv.id).subscribe({
      next: () => {
        this.loading = false;
        this.snackbarService.showSuccess('CV deleted successfully.');
        this.loadCVs();
        this.loadUserInfo();
      },
      error: () => {
        this.loading = false;
        this.snackbarService.showError(
          'An error occurred while deleting the CV.'
        );
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
        this.snackbarService.showError(
          'An error occurred while downloading the CV.'
        );
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

  // CV Review methods
  openReviewRequestModal(cvId: number): void {
    this.requestingReviewCvId = cvId;
    this.showReviewRequestModal = true;
  }

  onReviewRequestSubmitted(payload: {
    industry: number;
    experienceLevel: number;
    roles: number[];
  }): void {
    if (!this.requestingReviewCvId) return;

    const reviewPayload = {
      cv: this.requestingReviewCvId,
      industry: payload.industry,
      experience_level: payload.experienceLevel,
      roles: payload.roles,
    };

    this.specialService.requestCVReview(reviewPayload).subscribe({
      next: (review) => {
        this.showReviewRequestModal = false;
        this.requestingReviewCvId = null;
        this.snackbarService.showSuccess(
          'Your CV is being reviewed, this might take a while. Your results will appear here afterwards.'
        );
        this.loadReviewsForCV(review.cv);
      },
      error: (error) => {
        this.requestingReviewCvId = null;
        const errorMsg =
          error.error?.error ||
          'An error occurred while requesting the review.';
        this.snackbarService.showError(errorMsg);
      },
    });
  }

  onReviewRequestModalClosed(): void {
    this.showReviewRequestModal = false;
    this.requestingReviewCvId = null;
  }

  viewReviewResult(cvId: number): void {
    const completedReview = this.getCompletedReviewForCV(cvId);
    if (completedReview) {
      this.selectedReviewForView = completedReview;
      this.showReviewResultModal = true;
    }
  }

  onReviewResultModalClosed(): void {
    this.showReviewResultModal = false;
    this.selectedReviewForView = null;
  }
}
