import {
  Component, Input, Output, EventEmitter,
  CUSTOM_ELEMENTS_SCHEMA, OnChanges, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CoverLetterGenerationRequest } from 'src/app/interfaces';
import { marked } from 'marked';

@Component({
  selector: 'app-cover-letter-result-modal',
  standalone: true,
  imports: [CommonModule, ClarityModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './cover-letter-result-modal.component.html',
  styleUrls: ['./cover-letter-result-modal.component.scss'],
})
export class CoverLetterResultModalComponent implements OnChanges {
  @Input() open: boolean = false;
  @Input() request: CoverLetterGenerationRequest | null = null;
  @Output() closed = new EventEmitter<void>();
  renderedHtml: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['request'] && this.request?.result) {
      const parsed = marked.parse(this.request.result);
      if (typeof parsed === 'string') {
        this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(parsed);
      }
    }
  }

  onClrModalOpenChange(open: boolean): void {
    if (!open) {
      this.closed.emit();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
