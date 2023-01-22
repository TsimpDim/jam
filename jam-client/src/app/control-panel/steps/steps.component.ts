import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-steps',
  templateUrl: './steps.component.html',
  styleUrls: ['./steps.component.scss']
})
export class StepsComponent implements OnInit {

  public selectedStep: any = null;
  public stepForm: FormGroup;
  public modalIsOpen: boolean = false;
  public loading: boolean = false;
  public loadingSteps: boolean = true;
  public steps: any;
  public STEP_TYPES = {
    'S': 'Starting Step',
    'D': 'Default Step',
    'E': 'Ending Step'
  }
  selectedColor = 'grey';
  COLOR_HEXES = {
    'red': '#db4848',
    'grey': '#cccccc',
    'green': '#43cc7f',
    'blue': '#4696d4',
    'black': '#2e2e2e',
    'orange': '#fcba03'
  } as Record<string, string>;

  @HostListener('document:keydown.escape', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    this.modalIsOpen = false;
  }

  constructor(
    private formBuilder: FormBuilder,
    private jamService: JamService
  ) {
    this.stepForm = this.formBuilder.group({
      "name": new FormControl('', [Validators.required]),
      "type": new FormControl('', []),
      "color": new FormControl('', [Validators.maxLength(7), Validators.minLength(7)]),
      "notes": new FormControl('', []),
    })
  }

  ngOnInit(): void {
    this.getSteps();
  }

  selectColor(color: string) {
    this.selectedColor = color;
    this.stepForm.get('color')?.setValue(this.COLOR_HEXES[color]);
  }

  getStepTypeDisplayText(type?: String) {
    if (type === undefined) {
      return this.STEP_TYPES[this.selectedStep.type as keyof typeof this.STEP_TYPES];
    } else {
      return this.STEP_TYPES[type as keyof typeof this.STEP_TYPES];
    }
  }

  getSteps() {
    this.loadingSteps = true;
    this.jamService.getSteps()
    .subscribe({
      next: (data: any) => {
        this.steps = data;
      },
      error: () => {
        this.loadingSteps = false;
      },
      complete: () => this.loadingSteps = false
    })
  }

  clearAndOpenModal() {
    this.selectedStep = null;
    this.selectedColor = 'grey';
    this.stepForm.reset();
    this.openModal();
  }

  openModal() {
    this.modalIsOpen = true;
  }

  closeModal() {
    this.modalIsOpen = false;
    this.selectedStep = null;
    this.selectedColor = 'grey';
  }

  submitForm() {
    if (this.selectedStep == null) {
      this.createStep();
    } else {
      this.updateStep();
    }
  }

  selectStep(stepId: number) {
    this.selectedStep = this.steps.find((s: any) => s.id == stepId);
    this.selectedColor = Object.keys(this.COLOR_HEXES).find(c => this.COLOR_HEXES[c] === this.selectedStep.color) || 'grey';
    this.stepForm.reset(this.selectedStep);
    this.openModal();
  }

  deleteStep(stepId: number) {
    this.loading = true;
    this.jamService.deleteStep(
      stepId
    ).subscribe({
      next: () => {
        this.selectedStep = null;
        this.getSteps();
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        this.closeModal();
      }
    })
  }

  createStep() {
    this.loading = true;
    this.jamService.createStep(
      this.stepForm.value.name,
      this.stepForm.value.notes,
      this.stepForm.value.type,
      this.stepForm.value.color
    ).subscribe({
      next: () => {
        this.selectedStep = null;
        this.getSteps();
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        this.closeModal();
      }
    })
  }

  updateStep() {
    this.loading = true;
    this.jamService.updateStep(
      this.selectedStep.id,
      this.stepForm.value.name,
      this.stepForm.value.notes,
      this.stepForm.value.color
    ).subscribe({
      next: () => {
        this.selectedStep = null;
        this.getSteps();
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        this.closeModal();
      }
    })
  }
}
