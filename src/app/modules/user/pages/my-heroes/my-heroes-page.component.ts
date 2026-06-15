import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  Inject,
  LOCALE_ID,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthRepository } from '~modules/auth/store/auth.repository';
import { User } from '~modules/user/shared/user.model';
import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeroService } from '~modules/hero/shared/hero.service';
import { Hero } from '~modules/hero/shared/hero.model';
import { AlertId, AlertService } from '~modules/shared/services/alert.service';
import { UtilService } from '~modules/shared/services/util.service';
import { UserService } from '~modules/user/shared/user.service';
import { Modal } from 'bootstrap';
import { HeroModalComponent } from '~modules/user/components/hero-modal/hero-modal.component';

@Component({
  selector: 'app-my-heroes-page',
  templateUrl: './my-heroes-page.component.html',
  styleUrls: ['./my-heroes-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgOptimizedImage, HeroModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MyHeroesPageComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  user: User | undefined;
  window: Window;
  userHeroes: Hero[];
  heroModal: Modal | undefined;
  heroSelected: Hero | undefined;

  // eslint-disable-next-line max-params
  constructor(
    private authRepository: AuthRepository,
    private heroService: HeroService,
    private userService: UserService,
    private utilService: UtilService,
    private alertService: AlertService,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(LOCALE_ID) public locale: string,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.window = this.document.defaultView as Window;
    this.userHeroes = [];
  }

  ngOnInit() {
    this.authRepository.$user.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      if (user) {
        this.user = user;
      }
    });

    this.loadUserHeroes();
    this.heroModal = new bootstrap.Modal('#hero-modal', {});
    this.changeDetectorRef.detectChanges();
  }

  loadUserHeroes() {
    this.userService
      .getMe()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        if (user) {
          this.userHeroes = Object.assign([], user.heroes);
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  openHeroModal(hero?: Hero) {
    if (hero) {
      this.heroSelected = hero;
    } else {
      this.heroSelected = new Hero({
        id: '',
        realName: '',
        alterEgo: '',
        image: 'no-id',
        public: false,
        usersVoted: [],
      });
    }
    this.heroModal?.show();
    this.changeDetectorRef.markForCheck();
  }

  deleteHero(hero: Hero) {
    this.heroService
      .deleteHero(hero.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.userHeroes = this.userHeroes.filter(userHero => userHero.id !== hero.id);
        this.alertService.create(AlertId.HERO_DELETED);
        this.changeDetectorRef.markForCheck();
      });
  }
}
