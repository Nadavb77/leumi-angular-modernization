import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Inject,
  inject,
  OnInit,
} from '@angular/core';
import { EventBusService, EventBusType } from '~modules/shared/services/event-bus.service';
import { AppConfig } from '../../../../configs/app.config';
import { AlertService } from '~modules/shared/services/alert.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthRepository } from '~modules/auth/store/auth.repository';
import { DOCUMENT } from '@angular/common';
import { environment } from '~environments/environment';
import { ActivatedRoute } from '@angular/router';
import { authRoutes } from '~modules/auth/shared/auth-routes';

@Component({
  selector: 'app-logout-page',
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoutPageComponent implements OnInit {
  window: Window;
  private destroyRef = inject(DestroyRef);

  // eslint-disable-next-line max-params
  constructor(
    private alertService: AlertService,
    private eventBusService: EventBusService,
    private authRepository: AuthRepository,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.window = this.document.defaultView as Window;
  }

  ngOnInit(): void {
    const origin = this.activatedRoute.snapshot.queryParams[AppConfig.customQueryParams.origin];
    const alertId = this.activatedRoute.snapshot.queryParams[AppConfig.customQueryParams.alertId];

    this.authRepository.$user
      .pipe(takeUntilDestroyed(this.destroyRef))
      // eslint-disable-next-line rxjs-angular/prefer-takeuntil
      .subscribe(user => {
        let langToRedirect = '';
        if (user && user.language !== AppConfig.defaultLang) {
          langToRedirect = `/${user.language}`;
        }

        this.authRepository.clear();

        const path = new URL(`${environment.domain}${langToRedirect || ''}${authRoutes.logIn}`);
        if (origin) {
          path.searchParams.append(AppConfig.customQueryParams.origin, origin);
        }
        if (alertId) {
          path.searchParams.append(AppConfig.customQueryParams.alertId, alertId);
        }

        this.eventBusService.emit({
          type: EventBusType.FINISH_LOGOUT,
          data: { path },
        });
      });
  }
}
