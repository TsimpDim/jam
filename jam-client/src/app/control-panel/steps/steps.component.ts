import { Component, OnInit } from '@angular/core';
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
  public steps: any;

  constructor(
    private formBuilder: FormBuilder,
    private jamService: JamService
  ) {
    this.stepForm = this.formBuilder.group({
      "name": new FormControl('', [Validators.required]),
      "type": new FormControl('', []),
      "notes": new FormControl('', []),
    })
  }

  ngOnInit(): void {
    this.getSteps();
  }

  getSteps() {
    this.jamService.getSteps()
    .subscribe({
      next: (data: any) => {
        this.loading = false;
        this.steps = data;
      },
      error: () => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  clearAndOpenModal() {
    this.selectedStep = null;
    this.stepForm.get("name")?.setValue(null);
    this.stepForm.get("notes")?.setValue(null);
    this.stepForm.get("type")?.setValue(null);
    this.openModal();
  }

  openModal() {
    this.modalIsOpen = true;
  }

  closeModal() {
    this.modalIsOpen = false;
    this.selectedStep = null;
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
    this.stepForm.get('name')?.setValue(this.selectedStep.name);
    this.stepForm.get('notes')?.setValue(this.selectedStep.notes);
    this.stepForm.get('type')?.setValue(this.selectedStep.type);
    this.openModal();
  }

  deleteStep(stepId: number) {
    this.jamService.deleteStep(
      stepId
    ).subscribe({
      next: () => {
        this.loading = false;
        this.selectedStep = null;
        this.getSteps();
        this.closeModal();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  createStep() {
    this.jamService.createStep(
      this.stepForm.value.name,
      this.stepForm.value.notes,
      this.stepForm.value.type
    ).subscribe({
      next: () => {
        this.loading = false;
        this.selectedStep = null;
        this.getSteps();
        this.closeModal();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  updateStep() {
    this.jamService.updateStep(
      this.selectedStep.id,
      this.stepForm.value.name,
      this.stepForm.value.notes
    ).subscribe({
      next: () => {
        this.loading = false;
        this.selectedStep = null;
        this.getSteps();
        this.closeModal();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => {
        this.loading = false;
      }
    })
  }
}
