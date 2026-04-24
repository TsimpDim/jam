import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';

const JOB_NAV_WIDTH_STORAGE_KEY = 'jam_job_nav_width';
const JOB_NAV_MIN_WIDTH_PX = 220;
const JOB_NAV_MAX_WIDTH_VW = 30;
const JOB_NAV_DEFAULT_WIDTH_PX = 280;
const JOB_NAV_COLLAPSED_WIDTH_PX = 48;

@Component({
  selector: 'app-job-nav',
  templateUrl: './job-nav.component.html',
  styleUrls: ['./job-nav.component.scss'],
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

  // Drag resize state
  navWidth: number = JOB_NAV_DEFAULT_WIDTH_PX;
  isDragging: boolean = false;
  private startX: number = 0;
  private startWidth: number = 0;

  get effectiveWidth(): number {
    return this.navCollapsed ? JOB_NAV_COLLAPSED_WIDTH_PX : this.navWidth;
  }

  keepOriginalOrder = (a: any, b: any) => a.key;

  ngOnInit() {
    this.initLastOpenedGroup();
    this.initNavWidth();
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

  initNavWidth() {
    const savedWidth = localStorage.getItem(JOB_NAV_WIDTH_STORAGE_KEY);
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      const maxWidth = Math.floor(
        (window.innerWidth * JOB_NAV_MAX_WIDTH_VW) / 100
      );
      if (!isNaN(parsed) && parsed >= JOB_NAV_MIN_WIDTH_PX) {
        this.navWidth = Math.min(parsed, maxWidth);
      }
    }
  }

  onDragHandleMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX;
    this.startWidth = this.navWidth;
  }

  @HostListener('window:mousemove', ['$event'])
  onDragHandleMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.startX;
    const maxWidth = Math.floor(
      (window.innerWidth * JOB_NAV_MAX_WIDTH_VW) / 100
    );
    let newWidth = this.startWidth + deltaX;

    // Clamp between min and max
    newWidth = Math.max(JOB_NAV_MIN_WIDTH_PX, Math.min(newWidth, maxWidth));

    this.navWidth = newWidth;
  }

  @HostListener('window:mouseup', ['$event'])
  onDragHandleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      localStorage.setItem(JOB_NAV_WIDTH_STORAGE_KEY, this.navWidth.toString());
    }
  }

  // If the job nav is expanded and the user resizes the window
  // make sure that it doesn't exceed the window's width
  @HostListener('window:resize')
  onWindowResize() {
    const maxWidth = Math.floor(
      (window.innerWidth * JOB_NAV_MAX_WIDTH_VW) / 100
    );
    if (this.navWidth > maxWidth) {
      this.navWidth = maxWidth;
      localStorage.setItem(JOB_NAV_WIDTH_STORAGE_KEY, this.navWidth.toString());
    }
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
        JobNavComponent.lastOpenedGroup =
          Object.keys(this.applications)[0] || null;
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
      const matchingApps = (apps as any[]).filter(
        (app: any) =>
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
