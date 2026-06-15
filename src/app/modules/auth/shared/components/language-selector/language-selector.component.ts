import { ChangeDetectionStrategy, Component, Inject, LOCALE_ID } from '@angular/core';
import { Router } from '@angular/router';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UpperCasePipe],
})
export class LanguageSelectorComponent {
  constructor(
    public router: Router,
    @Inject(LOCALE_ID) public locale: string,
  ) {}
}
