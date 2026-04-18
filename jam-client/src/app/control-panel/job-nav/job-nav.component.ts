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
  @Output() onSortChange = new EventEmitter<string>();
  static lastOpenedGroup: string | null = null;

  sortBy: string = 'id';
  searchQuery: string = '';
  filteredApps: any = null;
  navCollapsed: boolean = false;

  keepOriginalOrder = (a: any, b: any) => a.key;

  ngOnInit() {
    this.initLastOpenedGroup();
    const savedSort = localStorage.getItem('jam_job_nav_sort');
    if (savedSort === 'date') {
      this.sortBy = '-id';
      localStorage.setItem('jam_job_nav_sort', this.sortBy);
    } else if (savedSort) {
      this.sortBy = savedSort;
    } else {
      this.sortBy = '-id';
      localStorage.setItem('jam_job_nav_sort', this.sortBy);
    }
    this.updateFilteredApps();
  }

  ngOnChanges() {
    this.initLastOpenedGroup();
    this.updateFilteredApps();
  }

  initLastOpenedGroup() {
    if (this.applications) {
      const saved = localStorage.getItem('jam_last_opened_group');
      if (saved && saved in this.applications) {
        JobNavComponent.lastOpenedGroup = saved;
      } else {
        JobNavComponent.lastOpenedGroup = Object.keys(this.applications)[0] || null;
      }
    }
  }

  updateFilteredApps() {
    if (!this.applications) {
      this.filteredApps = null;
      return;
    }
    if (!this.searchQuery.trim()) {
      this.filteredApps = this.applications;
      return;
    }
    
    const query = this.searchQuery.toLowerCase();
    const filtered: any = {};
    
    for (const [groupName, apps] of Object.entries(this.applications)) {
      const matchingApps = (apps as any[]).filter((app: any) => 
        app.company.toLowerCase().includes(query) || 
        app.role.toLowerCase().includes(query)
      );
      if (matchingApps.length > 0) {
        filtered[groupName] = matchingApps;
      }
    }
    
    this.filteredApps = Object.keys(filtered).length > 0 ? filtered : null;
  }

  onSearchKeyup(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.updateFilteredApps();
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

  handleSortChange(value: any) {
    const sortValue = typeof value === 'string' ? value : value.target.value;
    this.sortBy = sortValue;
    localStorage.setItem('jam_job_nav_sort', this.sortBy);
    this.onSortChange.emit(this.sortBy);
  }
}
