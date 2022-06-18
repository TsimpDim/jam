import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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

  createGroup() {
    this.loading = true;
    this.jamService.createGroup(
      this.groupForm.value.name,
      this.groupForm.value.description
    ).subscribe({
      next: () => {
        this.selectedGroup = null;
        this.getGroups();
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
