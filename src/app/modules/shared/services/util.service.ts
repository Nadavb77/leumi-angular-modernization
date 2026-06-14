import { Injectable } from '@angular/core';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { AlertId, AlertService } from '~modules/shared/services/alert.service';
import { CustomError } from '~modules/auth/shared/interfaces/custom-errors.enum';

@Injectable({
  providedIn: 'root',
})
export class UtilService {
  constructor(private alertService: AlertService) {}

  checkNetworkError(error: unknown): boolean {
    const isNetworkError = !(error instanceof CombinedGraphQLErrors);
    if (isNetworkError) {
      this.alertService.create(AlertId.NETWORK_ERROR, { code: CustomError.NETWORK_ERROR });
    }

    return isNetworkError;
  }
}
