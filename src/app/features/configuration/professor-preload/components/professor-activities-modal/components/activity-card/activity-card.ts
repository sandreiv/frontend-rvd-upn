import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { activityHoursRangeLabel } from '../../../../model/hours-limit.model';
import { CollapsibleSection } from '../../../../../../../shared/components/form/collapsible-section/collapsible-section';
import { Badge } from '../../../../../../../shared/ui/badge/badge';
import {
  ActivityTypeNode,
  activityComponentKey,
} from '../../../../model/professor-activities.model';
import { ProfessorLoadDetailItem } from '../../../../model/professor-load-detail.model';
import { ProfessorProjectItem } from '../../../../model/professor-project.model';
import { Subject } from '../direct/components/subject/subject';
import { Support } from '../direct/components/support/support';
import { ExtensionActivity } from '../extension-activity/extension-activity';
import { AdministrativeSituation } from '../management/components/administrative-situation/administrative-situation';
import { InstitutionalProject } from '../management/components/institutional-project/institutional-project';
import { PresetActivity } from '../management/components/preset-activity/preset-activity';
import { DegreeWork } from '../research/components/degree-work/degree-work';
import { ResearchProject } from '../research/components/research-project/research-project';


@Component({
  selector: 'app-activity-card',
  imports: [
    CollapsibleSection,
    Badge,
    Subject,
    Support,
    DegreeWork,
    ResearchProject,
    ExtensionActivity,
    PresetActivity,
    InstitutionalProject,
    AdministrativeSituation,
  ],
  templateUrl: './activity-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCard {
  readonly activity = input.required<ActivityTypeNode>();
  readonly idCoordinacion = input<number | null>(null);
  readonly idUnidadRegional = input<number | null>(null);
  readonly idPeriodoUniversidad = input<number | null>(null);
  readonly idConvocatoria = input<number | null>(null);
  readonly idCargaDocente = input<number | null>(null);
  readonly savedDetails = input<ProfessorLoadDetailItem[]>([]);
  readonly projects = input<ProfessorProjectItem[]>([]);
  readonly activityTree = input<ActivityTypeNode[]>([]);
  readonly hoursLimit = input<number | null>(null);
  readonly detailSaved = output<void>();

  readonly expanded = signal(false);

  readonly componentKey = computed(() => activityComponentKey(this.activity().componente));

  readonly hoursRange = computed(() =>
    activityHoursRangeLabel(
      this.activity(),
      this.activityTree().length ? this.activityTree() : [this.activity()],
    ),
  );
}
