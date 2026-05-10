import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../core/services/snackbar.service';

@Component({
  selector: 'app-snackbar-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './snackbar-container.component.html',
  styleUrls: ['./snackbar-container.component.scss'],
})
export class SnackbarContainerComponent {
  snackbars$ = this.snackbarService.snackbars$;

  constructor(private snackbarService: SnackbarService) {}

  dismiss(id: number): void {
    this.snackbarService.dismiss(id);
  }
}
