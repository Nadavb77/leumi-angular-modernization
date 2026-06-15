import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { User } from '~modules/user/shared/user.model';
import { TrimDirective } from '~modules/shared/directives/trim.directive';
import { FormErrorsComponent } from '~modules/shared/components/form-errors/form-errors.component';
import { LowercaseDirective } from '~modules/shared/directives/lowercase.directive';
import { ApolloError } from '@apollo/client/errors';
import { AuthService } from '~modules/auth/shared/auth.service';
import { AlertId, AlertService } from '~modules/shared/services/alert.service';
import { UtilService } from '~modules/shared/services/util.service';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TrimDirective, FormErrorsComponent, LowercaseDirective],
})
export class EditProfileComponent implements OnInit {
  user = input<User | undefined>();

  private destroyRef = inject(DestroyRef);

  isButtonProfileLoading: boolean;
  profileForm: FormGroup | undefined;
  firstname: FormControl | undefined;
  email: FormControl | undefined;

  // eslint-disable-next-line max-params
  constructor(
    private formBuilder: FormBuilder,
    private changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
    private alertService: AlertService,
    private utilService: UtilService,
  ) {
    this.isButtonProfileLoading = false;
  }

  ngOnInit(): void {
    this.firstname = new FormControl<string>(this.user()?.firstname || '', [
      Validators.required,
      Validators.minLength(2),
    ]);
    this.email = new FormControl<string>({ value: this.user()?.email || '', disabled: true });

    this.profileForm = this.formBuilder.group({
      firstname: this.firstname,
      email: this.email,
    });
  }

  sendForm() {
    const currentUser = this.user();
    if (this.profileForm?.valid && currentUser) {
      this.isButtonProfileLoading = true;

      const formValue = this.profileForm.getRawValue();
      this.authService
        .updateUser({
          ...currentUser,
          ...{
            firstname: formValue.firstname,
          },
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.handleUpdateUserResponse();
          },
          error: (error: ApolloError) => {
            this.handleUpdateUserError(error);
          },
        });
    }
  }

  handleUpdateUserResponse() {
    this.alertService.create(AlertId.USER_SAVED);
    this.isButtonProfileLoading = false;
    this.changeDetectorRef.detectChanges();
  }

  handleUpdateUserError(error: ApolloError) {
    const networkError = this.utilService.checkNetworkError(error);
    if (!networkError) {
      const registerErrors = error.graphQLErrors;
      if (registerErrors.length) {
        this.alertService.create(AlertId.UPDATE_USER_ERROR);
      }
    }
    this.isButtonProfileLoading = networkError;
    this.changeDetectorRef.detectChanges();
  }
}
