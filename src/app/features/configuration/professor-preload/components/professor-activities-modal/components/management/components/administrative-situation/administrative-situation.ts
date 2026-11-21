import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ActivityTypeNode } from '../../../../../../model/professor-activities.model';
import { ProfessorLoadDetailItem } from '../../../../../../model/professor-load-detail.model';
import { DependentActivitySelect } from '../../../dependent-activity-select/dependent-activity-select';

@Component({
  selector: 'app-administrative-situation',
  imports: [DependentActivitySelect],
  templateUrl: './administrative-situation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrativeSituation {
  readonly activity = input.required<ActivityTypeNode>();
  readonly idCoordinacion = input<number | null>(null);
  readonly idUnidadRegional = input<number | null>(null);
  readonly idCargaDocente = input<number | null>(null);
  readonly savedDetails = input<ProfessorLoadDetailItem[]>([]);
  readonly activityTree = input<ActivityTypeNode[]>([]);
  readonly hoursLimit = input<number | null>(null);
  readonly detailSaved = output<void>();
}
