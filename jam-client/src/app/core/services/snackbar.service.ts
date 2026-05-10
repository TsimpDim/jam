import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface SnackbarMessage {
  id: number;
  type: 'success' | 'error';
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class SnackbarService {
  private static readonly MAX_SNACKBARS = 3;
  private static readonly SUCCESS_DURATION = 4000;
  private static readonly ERROR_DURATION = 8000;

  private snackbars = new BehaviorSubject<SnackbarMessage[]>([]);
  snackbars$ = this.snackbars.asObservable();

  showSuccess(message: string): void {
    this.show(message, 'success', SnackbarService.SUCCESS_DURATION);
  }

  showError(message: string): void {
    this.show(message, 'error', SnackbarService.ERROR_DURATION);
  }

  dismiss(id: number): void {
    const current = this.snackbars.getValue();
    this.snackbars.next(current.filter((s) => s.id !== id));
  }

  getErrorMessage(error: HttpErrorResponse, fallback: string): string {
    if (error.error instanceof ProgressEvent) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    if (error.status === 0) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }

    if (error.status === 401) {
      return 'Session expired. Please log in again.';
    }

    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error.status === 404) {
      return 'The requested resource was not found.';
    }

    if (error.status === 500) {
      return 'A server error occurred. Please try again later.';
    }

    if (error.error && typeof error.error === 'object') {
      const values = Object.values(error.error).filter(Boolean);
      if (values.length > 0) {
        return values
          .flat()
          .filter((v) => typeof v === 'string')
          .join(' ');
      }
    }

    if (error.message) {
      return error.message;
    }

    return fallback;
  }

  private show(
    message: string,
    type: 'success' | 'error',
    duration: number
  ): void {
    const id = Date.now() + Math.random();
    const current = this.snackbars.getValue();

    // Limit max snackbars, remove oldest if exceeded
    const updated =
      current.length >= SnackbarService.MAX_SNACKBARS
        ? [...current.slice(1), { id, type, message }]
        : [...current, { id, type, message }];

    this.snackbars.next(updated);

    setTimeout(() => this.dismiss(id), duration);
  }
}
