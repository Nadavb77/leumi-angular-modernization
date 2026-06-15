import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  Inject,
  inject,
  LOCALE_ID,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '~modules/auth/shared/auth.service';
import { ObservableInput, throwError as observableThrowError } from 'rxjs';
import { AuthRepository } from '~modules/auth/store/auth.repository';
import EventBusEvent, {
  EventBCType,
  EventBusService,
  EventBusType,
} from '~modules/shared/services/event-bus.service';
import { AlertId, AlertService } from '~modules/shared/services/alert.service';
import { User } from '~modules/user/shared/user.model';
import { translations } from '../locale/translations';
import { AppConfig } from './configs/app.config';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { authRoutes } from '~modules/auth/shared/auth-routes';
import { Title } from '@angular/platform-browser';
import jwt_decode from 'jwt-decode';
import { catchError } from 'rxjs/operators';
import { HttpEvent } from '@angular/common/http';
import { HeaderComponent } from '~modules/shared/components/header/header.component';
import { SidebarComponent } from '~modules/shared/components/sidebar/sidebar.component';
import { FooterComponent } from '~modules/shared/components/footer/footer.component';
import { AlertComponent } from '~modules/shared/components/alert/alert.component';

// TODO: refactor all queries and mutations to use variables
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, FooterComponent, AlertComponent],
})
export class AppComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  user: User | undefined;
  isLoggedIn: boolean | undefined;
  isArrivalRoute: boolean;
  isLoggingOut: boolean;
  window: Window;

  // eslint-disable-next-line max-params
  constructor(
    private eventBusService: EventBusService,
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService,
    private authRepository: AuthRepository,
    private changeDetectorRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    @Inject(LOCALE_ID) public locale: string,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.isLoggingOut = false;
    this.isArrivalRoute = false;
    this.window = this.document.defaultView as Window;
  }

  ngOnInit() {
    this.checkAccessToken();
    this.subscribeForEvents();
    this.loadUserInfo();
    this.setMetaTags();
  }

  loadUserInfo() {
    this.authRepository
      .isLoggedIn()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isLoggedIn: boolean) => {
        this.isLoggedIn = isLoggedIn;
      });

    this.authRepository.$user.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      if (user) {
        this.user = user;
      }
    });
  }

  subscribeForEvents() {
    this.eventBusService.eventsBC.onmessage = event => {
      if (event.data.type === EventBCType.SESSION_CHANGED) {
        this.window.location.reload();
      }
    };

    this.eventBusService.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      if (event.type === EventBusType.FINISH_LOGOUT) {
        this.closeSessionAndReload(event);
      }
    });

    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(event => {
      this.handleRouteEvent(event);
    });

    this.window.onfocus = () => {
      this.checkAccessToken();
    };
  }

  handleRouteEvent(event: Event) {
    if (event instanceof NavigationEnd) {
      const refreshToken = this.authRepository.getRefreshTokenValue();
      if (refreshToken) {
        const refreshTokenValue: { exp: number } = jwt_decode(refreshToken);
        const isRefreshTokenExpired = Date.now() >= refreshTokenValue.exp * 1000;
        if (isRefreshTokenExpired && !event.url.includes(authRoutes.logout)) {
          this.router.navigate([authRoutes.logout], {
            queryParams: {
              origin: encodeURIComponent(this.window.location.href),
              alertId: AlertId.SESSION_EXPIRED,
            },
          });
        }
      }

      const alertId = this.activatedRoute.snapshot.queryParams[AppConfig.customQueryParams.alertId];
      if (alertId) {
        this.alertService.create(alertId);
      }

      this.isArrivalRoute = [
        `/${this.locale}` + authRoutes.logIn,
        `/${this.locale}` + authRoutes.register,
      ].includes(this.router.url);
    }
  }

  closeSessionAndReload(event: EventBusEvent) {
    this.isLoggingOut = true;
    this.changeDetectorRef.detectChanges();
    this.eventBusService.eventsBC.postMessage({
      type: EventBCType.SESSION_CHANGED,
    });
    this.window.location.href = (event.data as { path: string }).path;
  }

  checkAccessToken() {
    const accessToken = this.authRepository.getAccessTokenValue();
    const refreshToken = this.authRepository.getRefreshTokenValue();

    if (accessToken && refreshToken) {
      const accessTokenValue: { exp: number } = jwt_decode(accessToken);
      const isAccessTokenExpired = Date.now() >= accessTokenValue.exp * 1000;

      const refreshTokenValue: { exp: number } = jwt_decode(refreshToken);
      const isRefreshTokenExpired = Date.now() >= refreshTokenValue.exp * 1000;

      if (isAccessTokenExpired) {
        if (!isRefreshTokenExpired) {
          this.authService
            .refreshToken()
            .pipe(
              catchError((error): ObservableInput<HttpEvent<unknown>> => {
                this.navigateToLogout();
                return observableThrowError(error);
              }),
            )
            .subscribe();
        } else {
          this.navigateToLogout();
        }
      }
    }

    return true;
  }

  navigateToLogout() {
    this.router.navigate([authRoutes.logout], {
      queryParams: {
        origin: encodeURIComponent(this.window.location.href),
        alertId: AlertId.SESSION_EXPIRED,
      },
    });
  }

  setMetaTags() {
    this.titleService.setTitle(translations.title);
  }
}
