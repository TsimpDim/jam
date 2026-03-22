import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-job-nav',
  templateUrl: './job-nav.component.html',
  styleUrls: ['./job-nav.component.scss']
})
export class JobNavComponent implements OnInit {
  @Input() applications: any = null;
  @Input() loadingApplications: boolean = false;
  @Output() onSelectApp = new EventEmitter();
  @Output() onOpenAndClearJobAppModal = new EventEmitter();
  static lastOpenedGroup: string | null = null;

  keepOriginalOrder = (a: any, b: any) => a.key;

  ngOnInit() {
    const saved = localStorage.getItem('jam_last_opened_group');
    if (saved && this.applications && saved in this.applications) {
      JobNavComponent.lastOpenedGroup = saved;
    } else if (this.applications) {
      JobNavComponent.lastOpenedGroup = Object.keys(this.applications)[0] || null;
    }
  }

  toggleNavState(event: any, groupName: any) {
    event.stopPropagation();
    JobNavComponent.lastOpenedGroup = groupName;
    localStorage.setItem('jam_last_opened_group', groupName);
  }

  onAppSelect(groupName: string) {
    JobNavComponent.lastOpenedGroup = groupName;
    localStorage.setItem('jam_last_opened_group', groupName);
  }

  getNavState(groupName: any) {
    return JobNavComponent.lastOpenedGroup === groupName;
  }
}
