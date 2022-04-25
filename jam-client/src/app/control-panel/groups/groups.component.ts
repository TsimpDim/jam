import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit {
  public groups: any;
  public loading: Boolean = true;
  public modalIsOpen: boolean = false;
  public selectedGroup: any = null;
  public groupForm: FormGroup;

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

  getGroups() {
    this.jamService.getGroups()
    .subscribe({
      next: (data) => {
        this.loading = false;
        this.groups = data;
      },
      error: (error) => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  clearAndOpenModal() {
    this.selectedGroup = null;
    this.groupForm.get("name")?.setValue(null);
    this.groupForm.get("description")?.setValue(null);
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
    this.groupForm.get('name')?.setValue(this.selectedGroup.name);
    this.groupForm.get('description')?.setValue(this.selectedGroup.description);
    this.openModal();
  }

  submitForm() {
    if (this.selectedGroup == null) {
      this.createGroup();
    } else {
      this.updateGroup();
    }
  }

  deleteGroup(groupId: number) {
    this.jamService.deleteGroup(
      groupId
    ).subscribe({
      next: () => {
        this.loading = false;
        this.selectedGroup = null;
        this.getGroups();
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

  createGroup() {
    this.jamService.createGroup(
      this.groupForm.value.name,
      this.groupForm.value.description
    ).subscribe({
      next: () => {
        this.loading = false;
        this.selectedGroup = null;
        this.getGroups();
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

  updateGroup() {
    this.jamService.updateGroup(
      this.selectedGroup.id,
      this.groupForm.value.name,
      this.groupForm.value.description
    ).subscribe({
      next: () => {
        this.loading = false;
        this.selectedGroup = null;
        this.getGroups();
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
