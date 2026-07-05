import {
  Component,
  Input,
  Output,
  EventEmitter,
  CUSTOM_ELEMENTS_SCHEMA,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CVReview } from 'src/app/interfaces';
import { marked } from 'marked';

@Component({
  selector: 'app-cv-review-result-modal',
  standalone: true,
  imports: [CommonModule, ClarityModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './cv-review-result-modal.component.html',
  styleUrls: ['./cv-review-result-modal.component.scss'],
})
export class CvReviewResultModalComponent implements OnChanges {
  @Input() open: boolean = false;
  @Input() review: CVReview | null = null;
  @Output() closed = new EventEmitter<void>();
  renderedHtml: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['review'] && this.review?.review_result) {
      const parsed = marked.parse(this.review.review_result);
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
}
