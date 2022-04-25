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
  public openEditModal: boolean = false;
  public selectedGroup: any;
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

  toggleEditModal() {
    this.openEditModal = !this.openEditModal;
  }

  selectGroup(groupId: number) {
    this.selectedGroup = this.groups.find((g: any) => g.id == groupId);
    this.groupForm.get('name')?.setValue(this.selectedGroup.name);
    this.groupForm.get('description')?.setValue(this.selectedGroup.description);
    this.toggleEditModal();
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
