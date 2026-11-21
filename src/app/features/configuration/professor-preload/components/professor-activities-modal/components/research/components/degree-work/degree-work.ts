import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ActivityTypeNode } from '../../../../../../model/professor-activities.model';
import { ProfessorLoadDetailItem } from '../../../../../../model/professor-load-detail.model';
import {
  ProfessorProjectItem,
  projectsForActivity,
} from '../../../../../../model/professor-project.model';
import { ProjectTable } from '../../../project-table/project-table';

@Component({
  selector: 'app-degree-work',
  imports: [ProjectTable],
  templateUrl: './degree-work.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DegreeWork {
  readonly activity = input.required<ActivityTypeNode>();
  readonly projects = input<ProfessorProjectItem[]>([]);
  readonly idCoordinacion = input<number | null>(null);
  readonly idUnidadRegional = input<number | null>(null);
  readonly idCargaDocente = input<number | null>(null);
  readonly savedDetails = input<ProfessorLoadDetailItem[]>([]);
  readonly activityTree = input<ActivityTypeNode[]>([]);
  readonly hoursLimit = input<number | null>(null);
  readonly detailSaved = output<void>();

  readonly rows = computed(() => projectsForActivity(this.projects(), this.activity().id));
}
