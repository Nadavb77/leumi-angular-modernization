import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Inject,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthRepository } from '~modules/auth/store/auth.repository';
import { User } from '~modules/user/shared/user.model';
import { DOCUMENT, UpperCasePipe } from '@angular/common';
import { APP_CONFIG } from '../../../../configs/app.config';
import { IAppConfig } from '../../../../configs/app-config.interface';
import { EditProfileComponent } from '~modules/user/components/edit-profile/edit-profile.component';
import { ChangePasswordComponent } from '~modules/user/components/change-password/change-password.component';
import { ChangeLanguageComponent } from '~modules/user/components/change-language/change-language.component';
import { DeleteAccountComponent } from '~modules/user/components/delete-account/delete-account.component';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UpperCasePipe,
    EditProfileComponent,
    ChangePasswordComponent,
    ChangeLanguageComponent,
    DeleteAccountComponent,
  ],
})
export class MyAccountComponent implements OnInit {
  user: User | undefined;
  public innerWidth: number;
  private destroyRef = inject(DestroyRef);

  constructor(
    private authRepository: AuthRepository,
    @Inject(DOCUMENT) private document: Document,
    @Inject(APP_CONFIG) public appConfig: IAppConfig,
  ) {
    this.innerWidth = (this.document.defaultView as Window).innerWidth;
  }

  ngOnInit() {
    this.authRepository.$user.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(user => {
      if (user) {
        this.user = user;
      }
    });
  }
}
