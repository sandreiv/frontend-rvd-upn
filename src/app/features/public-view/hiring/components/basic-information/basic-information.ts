import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { Icon } from '../../../../../shared/ui/icon/icon';
import { PublicBasicInformation } from '../../model/hiring.model';

@Component({
  selector:
    'app-public-basic-information',
  imports: [Icon],
  templateUrl:
    './basic-information.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class BasicInformation {
  readonly information =
    input.required<PublicBasicInformation>();

  value(
    value: string | number | null | undefined,
  ): string {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ''
    ) {
      return '—';
    }

    return String(value);
  }

  formatDate(
    value: string | null,
  ): string {
    if (!value) {
      return '—';
    }

    const parts = value.split('-');

    if (parts.length !== 3) {
      return value;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
}