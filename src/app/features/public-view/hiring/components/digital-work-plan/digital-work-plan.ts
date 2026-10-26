import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { CollapsibleSection } from '../../../../../shared/components/form/collapsible-section/collapsible-section';
import { Icon } from '../../../../../shared/ui/icon/icon';

import {
  PublicDigitalWorkPlan,
} from '../../model/hiring.model';

@Component({
  selector: 'app-public-digital-work-plan',

  imports: [
    CollapsibleSection,
    Icon,
  ],

  templateUrl:
    './digital-work-plan.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class DigitalWorkPlan {

  readonly plan =
    input<PublicDigitalWorkPlan | null>(
      null,
    );

  readonly loading =
    input(false);

  readonly error =
    input(false);

  readonly expanded =
    input(false);

  readonly expandedChange =
    output<boolean>();

  onExpandedChange(
    expanded: boolean,
  ): void {
    this.expandedChange.emit(
      expanded,
    );
  }

  hoursLabel(
    hours: number | null,
  ): string {
    return hours == null
      ? '—'
      : `${hours} h`;
  }

  percentageLabel(
    percentage: number | null,
  ): string {
    return percentage == null
      ? '—'
      : `${percentage} %`;
  }

  levelLabel(
    level: string | null,
  ): string {

    if (!level) {
      return '—';
    }

    const normalized =
      level
        .trim()
        .toUpperCase();

    const labels:
      Record<string, string> = {

      A1: 'A1 (Principiante)',
      A2: 'A2 (Principiante)',

      B1: 'B1 (Intermedio)',
      B2: 'B2 (Intermedio)',

      C1: 'C1 (Avanzado)',
      C2: 'C2 (Avanzado)',
    };

    return (
      labels[normalized] ??
      level
    );
  }
}