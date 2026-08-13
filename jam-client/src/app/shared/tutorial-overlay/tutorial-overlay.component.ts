import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';

interface TutorialStep {
  id: string;
  target: string | null;
  title: string;
  description: string;
  bullets: string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    target: 'empty-state-add-btn',
    title: 'Welcome to JAM!',
    description:
      'Track your entire job search - applications, steps, leads, CVs and ' +
      'analytics - all in one place. This quick tour shows what each section of the app can do.' +
      'You can skip it at any time with the button below',
    bullets: [
      'Add a job application to start following your hiring timeline',
      'Leave notes and upload files for each application',
      'Group your applications to have a better overview of your job search',
    ],
  },
  {
    id: 'steps',
    target: 'nav-steps',
    title: 'Steps',
    description:
      'Steps are the stages of your hiring timeline. Every application ' +
      'follows the same steps on its timeline, so you always know how far ' +
      'along you are.',
    bullets: [
      'Create, edit, and delete the available steps',
      'Set a name, type and colour for each step',
    ],
  },
  {
    id: 'leads',
    target: 'nav-leads',
    title: 'Leads',
    description:
      "Leads are job opportunities you have found but haven't applied " +
      'to yet. Keep them here until you are ready to apply.',
    bullets: [
      'Add leads manually or generate them automatically via web search',
      'Generate AI cover letters for your leads',
    ],
  },
  {
    id: 'cv',
    target: 'nav-cv',
    title: 'CVs',
    description:
      'Keep all your CVs in one place and make them stronger before you ' +
      'send them out.',
    bullets: [
      'Upload CV files (PDF, DOC, DOCX) with descriptive names',
      'Request AI-powered CV reviews and get feedback',
      'Download your CVs whenever you need them',
    ],
  },
  {
    id: 'analytics',
    target: 'nav-analytics',
    title: 'Analytics',
    description:
      'Get a clear picture of how your job search is performing with ' +
      'charts and statistics.',
    bullets: [
      'Track application trends and your hiring funnel',
      'See average time per stage and CV usage',
      'Filter analytics per group',
    ],
  },
];

@Component({
  selector: 'app-tutorial-overlay',
  standalone: true,
  imports: [CommonModule, ClarityModule],
  templateUrl: './tutorial-overlay.component.html',
  styleUrls: ['./tutorial-overlay.component.scss'],
})
export class TutorialOverlayComponent implements OnChanges {
  @Input() step = 0;

  @Output() onStepChange = new EventEmitter<number>();
  @Output() onComplete = new EventEmitter<void>();

  @ViewChild('tooltipCard') tooltipCard?: ElementRef<HTMLElement>;

  readonly steps = TUTORIAL_STEPS;

  hasTarget = false;
  spotlight: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null = null;
  cardTop = 0;
  cardLeft = 0;

  get current(): TutorialStep {
    return TUTORIAL_STEPS[this.step] ?? TUTORIAL_STEPS[0];
  }

  get isLast(): boolean {
    return this.step >= TUTORIAL_STEPS.length - 1;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['step']) {
      setTimeout(() => this.positionOverlay());
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.positionOverlay());
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    this.positionOverlay();
  }

  next(): void {
    if (this.isLast) {
      this.onComplete.emit();
      return;
    }
    this.goTo(this.step + 1);
  }

  back(): void {
    if (this.step > 0) {
      this.goTo(this.step - 1);
    }
  }

  skip(): void {
    this.onComplete.emit();
  }

  goTo(step: number): void {
    if (step !== this.step && step >= 0 && step < TUTORIAL_STEPS.length) {
      this.onStepChange.emit(step);
    }
  }

  private positionOverlay(): void {
    const targetEl = document.getElementById(this.current.target ?? '');
    const rect = targetEl?.getBoundingClientRect();

    if (!rect || rect.width <= 0 || rect.height <= 0 || rect.bottom <= 0) {
      this.hasTarget = false;
      this.spotlight = null;
      this.positionCardCentered();
      return;
    }

    this.hasTarget = true;
    const pad = 4;
    this.spotlight = {
      left: rect.left - pad,
      top: rect.top - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    };

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 14;
    const cardWidth = Math.min(420, vw - 32);
    let cardLeft = rect.left + rect.width / 2 - cardWidth / 2;
    cardLeft = Math.max(16, Math.min(cardLeft, vw - cardWidth - 16));

    const cardHeight = this.tooltipCard?.nativeElement.offsetHeight || 320;
    let cardTop = rect.bottom + gap;
    if (cardTop + cardHeight > vh - 120) {
      cardTop = rect.top - gap - cardHeight;
    }
    if (cardTop < 8) {
      cardTop = 8;
    }

    this.cardLeft = cardLeft;
    this.cardTop = cardTop;
  }

  private positionCardCentered(): void {
    const vw = window.innerWidth;
    const cardWidth = Math.min(420, vw - 32);
    this.cardLeft = (vw - cardWidth) / 2;
    this.cardTop = 96;
  }
}
