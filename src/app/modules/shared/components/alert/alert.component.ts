import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Alert,
  AlertData,
  AlertEvent,
  AlertEventType,
  AlertId,
  AlertService,
  AlertType,
} from '~modules/shared/services/alert.service';
import { AppConfig } from '../../../../configs/app.config';
import { EventBusService } from '~modules/shared/services/event-bus.service';
import { getAlertConfigById } from '~modules/shared/components/alert/alerts.config';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  alerts: Alert[];
  alertTimeout: ReturnType<typeof setTimeout> | undefined;
  timeoutAlertId: AlertId | undefined;

  constructor(
    private alertService: AlertService,
    private changeDetectorRef: ChangeDetectorRef,
    private eventBusService: EventBusService,
  ) {
    this.alerts = [];
  }

  ngOnInit() {
    this.alertService.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((alertEvent: AlertEvent) => {
        if (alertEvent.type === AlertEventType.CREATE_ALERT) {
          this.createAlert(alertEvent);
        } else if (alertEvent.type === AlertEventType.REMOVE_ALERT) {
          this.alerts = this.alerts.filter(alert => alert.id !== alertEvent.data?.alertId);
          this.changeDetectorRef.detectChanges();
        } else if (alertEvent.type === AlertEventType.CLOSE_ALL) {
          const exceptions = alertEvent.options?.exceptions;
          this.alerts = exceptions
            ? this.alerts.filter(alert => exceptions.find(exception => alert.id === exception))
            : [];
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  createAlert(alertEvent: AlertEvent) {
    const alertData = alertEvent.data as AlertData;
    const newAlert = getAlertConfigById(alertData.alertId);
    if (newAlert) {
      this.setAlertKeys(alertData, newAlert);

      if (newAlert.options?.static) {
        this.alerts = [];
      }

      if (this.timeoutAlertId === newAlert.id && this.alertTimeout) {
        clearTimeout(this.alertTimeout);
      }

      const alertExists = this.alerts.find(alert => alert.id === newAlert.id);
      if (alertExists) {
        this.alerts = this.alerts.filter(alert => alert.id !== newAlert.id);
      }

      this.alerts.push(newAlert);
      setTimeout(() => {
        this.changeDetectorRef.detectChanges();
      }, newAlert.delay);

      this.setAlertTimeOut(newAlert);
    }
  }

  setAlertKeys(alertData: AlertData, newAlert: Alert) {
    newAlert.code = alertData.options?.code || undefined;
    newAlert.delay = alertData.options?.delay || 0;
  }

  setAlertTimeOut(newAlert: Alert) {
    if (
      !newAlert.options?.forceStay &&
      [AlertType.INFO, AlertType.SUCCESS].includes(newAlert.type)
    ) {
      this.timeoutAlertId = newAlert.id;
      this.alertTimeout = setTimeout(() => {
        this.closeAlert(newAlert);
      }, AppConfig.alertMilliseconds);
    }
  }

  buttonClicked(alert: Alert) {
    const actionType = alert.options?.button?.actionType;
    if (actionType) {
      this.eventBusService.emit({ type: actionType });
    }
  }

  closeAlert(alertClosed: Alert) {
    this.alerts = this.alerts.filter(alert => alert.message !== alertClosed.message);
    this.changeDetectorRef.detectChanges();
  }
}
