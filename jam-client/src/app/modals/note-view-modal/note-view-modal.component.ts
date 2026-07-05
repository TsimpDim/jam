import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { JamService } from 'src/app/core/api/jam.service';

@Component({
  selector: 'app-note-view-modal',
  standalone: true,
  imports: [CommonModule, ClarityModule],
  templateUrl: './note-view-modal.component.html',
  styleUrls: ['./note-view-modal.component.scss'],
})
export class NoteViewModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() timelineStep: any = null;
  @Output() onClose = new EventEmitter();
  @Output() onNoteUpdated = new EventEmitter();

  @ViewChild('noteContent') noteContentElement?: ElementRef<HTMLElement>;

  public noteText: string = '';
  public editText: string = '';
  public isEditing: boolean = false;
  public isSaving: boolean = false;
  public textareaHeight: string = '200px';

  constructor(private jamService: JamService) {}

  ngOnChanges(changes: SimpleChanges) {
    const shouldInit =
      (changes['isOpen'] || changes['timelineStep']) &&
      this.isOpen &&
      this.timelineStep;
    if (shouldInit) {
      this.noteText = this.timelineStep.notes || '';
      this.editText = this.noteText;
      this.isEditing = !this.noteText;
      this.isSaving = false;
    }
  }

  closeModal() {
    this.onClose.emit();
    this.resetState();
  }

  resetState() {
    this.isEditing = false;
    this.isSaving = false;
  }

  onClrModalOpenChange(open: boolean) {
    if (!open) {
      this.onClose.emit();
      this.resetState();
    }
  }

  startEditing() {
    // Capture the current rendered height of the note content so the
    // textarea opens at the exact same size - no layout jump.
    if (this.noteContentElement) {
      const el = this.noteContentElement.nativeElement;
      const height = Math.max(el.scrollHeight, el.offsetHeight, 200);
      this.textareaHeight = `${height}px`;
    }
    this.editText = this.noteText;
    this.isEditing = true;
  }

  cancelEditing() {
    // If no notes exist, close immediately - no empty view state flash
    if (this.noteText.length === 0 && this.editText.length === 0) {
      this.closeModal();
      return;
    }
    this.isEditing = false;
    this.editText = this.noteText;
  }

  saveNote() {
    if (this.isSaving) return;
    if (this.editText.length === 0 || this.editText === this.noteText) {
      this.closeModal();
      return;
    }

    this.isSaving = true;
    this.jamService
      .updateTimelineStep(this.timelineStep.id, {
        notes: this.editText,
      })
      .subscribe({
        next: () => {
          this.noteText = this.editText;
          this.isEditing = false;
          this.isSaving = false;
          this.onNoteUpdated.emit();
        },
        error: () => {
          this.isSaving = false;
        },
      });
  }
}
