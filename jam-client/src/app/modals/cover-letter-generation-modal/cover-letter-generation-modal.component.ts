import {
  Component,
  EventEmitter,
  Input,
  Output,
  CUSTOM_ELEMENTS_SCHEMA,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { JamService } from 'src/app/core/api/jam.service';
import { CV } from 'src/app/interfaces';

@Component({
  selector: 'app-cover-letter-generation-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClarityModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './cover-letter-generation-modal.component.html',
  styleUrls: ['./cover-letter-generation-modal.component.scss'],
})
export class CoverLetterGenerationModalComponent implements OnChanges, OnInit {
  @Input() open: boolean = false;
  @Input() leadId: number | null = null;
  @Output() submitted = new EventEmitter<{ cv: number; lead: number }>();
  @Output() closed = new EventEmitter<void>();

  form: FormGroup;
  submitting = false;
  cvs: CV[] = [];

  constructor(
    private fb: FormBuilder,
    private jamService: JamService,
  ) {
    this.form = this.fb.group({
      cv: new FormControl(null, [Validators.required]),
    });
  }

  ngOnInit(): void {
    this.loadCVs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) {
      this.loadCVs();
    }
  }

  loadCVs(): void {
    this.jamService.getCVs().subscribe({
      next: (data: CV[]) => {
        this.cvs = data;
      },
    });
  }

  onModalOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.submitted.emit({
      cv: this.form.get('cv')!.value,
      lead: this.leadId!,
    });
  }

  close(): void {
    this.form.reset();
    this.submitting = false;
    this.closed.emit();
  }
}
