import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit {
  public groups: any = null;
  public loadingGroups: boolean = true;
  public loading : boolean = false;
  public modalIsOpen: boolean = false;
  public selectedGroup: any = null;
  public groupForm: FormGroup;
  public errorMessage: string = '';

  @HostListener('document:keydown.escape', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    this.modalIsOpen = false;
  }

  constructor(
    private jamService: JamService,
    private formBuilder: FormBuilder
  ) {
    this.groupForm = this.formBuilder.group({
      "name": new FormControl('', [Validators.required]),
      "description": new FormControl('', [])
    })
  }

  ngOnInit(): void {
    this.getGroups();
  }

  dropGroup(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.groups, event.previousIndex, event.currentIndex);
    const positions = this.groups.map((g: any, i: number) => ({ id: g.id, position: i }));
    this.jamService.reorderGroups(positions).subscribe();
  }

  getGroups() {
    this.loadingGroups = true;
    this.jamService.getGroups()
    .subscribe({
      next: (data) => {
        this.groups = data;
      },
      error: () => {
        this.loadingGroups = false;
      },
      complete: () => this.loadingGroups = false
    })
  }

  clearAndOpenModal() {
    this.selectedGroup = null;
    this.groupForm.reset();
    this.openModal();
  }

  openModal() {
    this.modalIsOpen = true;
  }

  closeModal() {
    this.modalIsOpen = false;
    this.selectedGroup = null;
  }

  selectGroup(groupId: number) {
    this.selectedGroup = this.groups.find((g: any) => g.id == groupId);
    this.groupForm.reset(this.selectedGroup);
    this.openModal();
  }

  submitForm() {
    this.errorMessage = '';
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }
    
    if (this.selectedGroup == null) {
      this.createGroup();
    } else {
      this.updateGroup();
    }
  }

  deleteGroup(groupId: number) {
    this.loading = true;
    this.jamService.deleteGroup(
      groupId
    ).subscribe({
      next: () => {
        this.selectedGroup = null;
        this.getGroups();
        this.closeModal();
      },
      error: (e) => {
        this.loading = false;
        this.errorMessage = 'An error occurred while deleting the group.';
        if (e.error) {
          this.errorMessage = JSON.stringify(e.error);
        }
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  createGroup() {
    this.loading = true;
    this.jamService.createGroup(
      this.groupForm.value.name,
      this.groupForm.value.description
    ).subscribe({
      next: () => {
        this.selectedGroup = null;
        this.getGroups();
        this.closeModal();
      },
      error: (e) => {
        this.loading = false;
        this.errorMessage = 'An error occurred while creating the group.';
        if (e.error) {
          this.errorMessage = JSON.stringify(e.error);
        }
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  updateGroup() {
    this.loading = true;
    this.jamService.updateGroup(
      this.selectedGroup.id,
      this.groupForm.value.name,
      this.groupForm.value.description
    ).subscribe({
      next: () => {
        this.selectedGroup = null;
        this.getGroups();
        this.closeModal();
      },
      error: (e) => {
        this.loading = false;
        this.errorMessage = 'An error occurred while updating the group.';
        if (e.error) {
          this.errorMessage = JSON.stringify(e.error);
        }
      },
      complete: () => {
        this.loading = false;
      }
    })
  }
}
