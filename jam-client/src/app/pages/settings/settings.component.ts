import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';

interface McpTokenEntry {
  token_key: string;
  created: string;
  expiry: string | null;
}

interface McpTokenListResponse {
  tokens: McpTokenEntry[];
  limit: number;
  count: number;
  is_premium: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ClarityModule, ConfirmModalComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  tokens: McpTokenEntry[] = [];
  loading: boolean = false;
  generating: boolean = false;

  tokenLimit: number = 1;
  tokenCount: number = 0;

  justCreatedToken: string | null = null;
  copiedToClipboard: boolean = false;

  confirmModalOpen: boolean = false;
  tokenToDelete: McpTokenEntry | null = null;

  constructor(
    private jamService: JamService,
    private snackbarService: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.loadTokens();
  }

  loadTokens(): void {
    this.loading = true;
    this.jamService.listMcpTokens().subscribe({
      next: (data: McpTokenListResponse) => {
        this.tokens = data.tokens || [];
        this.tokenLimit = data.limit || 1;
        this.tokenCount = data.count || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading MCP tokens:', error);
        this.loading = false;
        this.snackbarService.showError(
          this.snackbarService.getErrorMessage(
            error,
            'Unable to load MCP tokens.',
          ),
        );
      },
    });
  }

  generateToken(): void {
    if (this.generating || this.tokenCount >= this.tokenLimit) {
      return;
    }

    this.generating = true;
    this.jamService.generateMcpToken().subscribe({
      next: (res: { token: string }) => {
        this.justCreatedToken = res.token;
        this.copiedToClipboard = false;
        this.generating = false;
        this.loadTokens();
      },
      error: (error) => {
        this.generating = false;
        this.snackbarService.showError(
          this.snackbarService.getErrorMessage(
            error,
            'Unable to generate an MCP token.',
          ),
        );
      },
    });
  }

  copyToken(): void {
    if (!this.justCreatedToken) return;
    navigator.clipboard.writeText(this.justCreatedToken).then(() => {
      this.copiedToClipboard = true;
      setTimeout(() => (this.copiedToClipboard = false), 2000);
    });
  }

  openDeleteConfirm(token: McpTokenEntry): void {
    this.tokenToDelete = token;
    this.confirmModalOpen = true;
  }

  onDeleteConfirmed(): void {
    if (this.tokenToDelete !== null) {
      this.deleteToken(this.tokenToDelete);
    }
    this.confirmModalOpen = false;
    this.tokenToDelete = null;
  }

  onDeleteCancelled(): void {
    this.confirmModalOpen = false;
    this.tokenToDelete = null;
  }

  deleteToken(token: McpTokenEntry): void {
    this.jamService.deleteMcpToken(token.token_key).subscribe({
      next: () => {
        this.snackbarService.showSuccess('MCP token deleted successfully.');
        this.loadTokens();
      },
      error: (error) => {
        this.snackbarService.showError(
          this.snackbarService.getErrorMessage(
            error,
            'An error occurred while deleting the MCP token.',
          ),
        );
      },
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  }
}
