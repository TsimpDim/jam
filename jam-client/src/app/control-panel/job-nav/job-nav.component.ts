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
  navState: any = {};

  constructor() { }

  persistNavState(event: boolean, groupName: any) {
    this.navState[groupName] = event;
  }

  getNavState(groupName: any) {
    return this.navState[groupName];
  }
}
