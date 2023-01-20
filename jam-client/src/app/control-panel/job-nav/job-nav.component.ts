import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-job-nav',
  templateUrl: './job-nav.component.html',
  styleUrls: ['./job-nav.component.scss']
})
export class JobNavComponent {
  @Input() applications: any = null;
  @Input() loadingApplications: boolean = false;
  @Output() onSelectApp = new EventEmitter();
  @Output() onOpenAndClearJobAppModal = new EventEmitter();
  static navState: any = {};

  toggleNavState(event: any, groupName: any) {
    event.stopPropagation();

    if (JobNavComponent.navState[groupName] !== undefined) {
      JobNavComponent.navState[groupName] = !JobNavComponent.navState[groupName];
    } else {
      JobNavComponent.navState[groupName] = true;
    }
  }

  getNavState(groupName: any) {
    return JobNavComponent.navState[groupName];
  }
}
