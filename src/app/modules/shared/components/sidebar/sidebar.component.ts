import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Inject,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventBusService, EventBusType } from '~modules/shared/services/event-bus.service';
import { DOCUMENT } from '@angular/common';
import { userRoutes } from '~modules/user/shared/user-routes';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { User } from '~modules/user/shared/user.model';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
})
export class SidebarComponent implements OnInit {
  @Input() user: User | undefined;

  userRoutes: typeof userRoutes;
  currentUrl: string;
  showEmptySpace: boolean;
  private destroyRef = inject(DestroyRef);

  // eslint-disable-next-line max-params
  constructor(
    private eventBusService: EventBusService,
    public router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.showEmptySpace = false;
    this.currentUrl = '';
    this.userRoutes = userRoutes;
  }

  ngOnInit() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentUrl = event.url;
        this.changeDetectorRef.detectChanges();
      }
    });

    this.eventBusService.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event.type === EventBusType.TOGGLE_SIDEBAR) {
        this.showEmptySpace = !this.showEmptySpace;
      } else if (event.type === EventBusType.CLOSE_SIDEBAR) {
        this.showEmptySpace = false;
        this.closeSidebar();
      }
      this.changeDetectorRef.detectChanges();
    });
  }

  closeSidebar() {
    const sidebar = this.document.getElementById('sidebar');
    sidebar?.classList.remove('show');
    this.showEmptySpace = false;
    this.changeDetectorRef.detectChanges();
  }
}
