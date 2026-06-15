import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  Inject,
  inject,
  LOCALE_ID,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthRepository } from '~modules/auth/store/auth.repository';
import { DOCUMENT } from '@angular/common';
import { AppConfig } from '../../../../configs/app.config';

@Component({
  selector: 'app-error404-page',
  templateUrl: './error404-page.component.html',
  styleUrls: ['./error404-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Error404PageComponent implements OnInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  urlToRedirect: string;

  // eslint-disable-next-line max-params
  constructor(
    private renderer: Renderer2,
    private authRepository: AuthRepository,
    @Inject(DOCUMENT) private document: Document,
    @Inject(LOCALE_ID) public locale: string,
  ) {
    this.urlToRedirect = this.locale !== AppConfig.defaultLang ? `/${locale}` : '/';
  }

  ngOnInit() {
    this.authRepository
      .isLoggedIn()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isLoggedIn: boolean) => {
        if (!isLoggedIn) {
          this.renderer.addClass(this.document.body, 'bg-white');
        } else {
          this.renderer.removeClass(this.document.body, 'bg-white');
        }
      });
  }

  ngOnDestroy() {
    this.renderer.removeClass(this.document.body, 'bg-white');
  }
}
