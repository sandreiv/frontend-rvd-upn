import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CollapsibleSection } from '../../../../../../../shared/components/form/collapsible-section/collapsible-section';
import {
  ActivityTypeNode,
  activityComponentKey,
} from '../../../../model/professor-activities.model';
import { ProfessorLoadDetailItem } from '../../../../model/professor-load-detail.model';
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
  readonly detailSaved = output<void>();

  readonly expanded = signal(false);

  readonly componentKey = computed(() => activityComponentKey(this.activity().componente));
}
