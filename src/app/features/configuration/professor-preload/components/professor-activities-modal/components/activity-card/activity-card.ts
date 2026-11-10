import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { CollapsibleSection } from '../../../../../../../shared/components/form/collapsible-section/collapsible-section';
import {
  ActivityTypeNode,
  activityComponentKey,
} from '../../../../model/professor-activities.model';
import { AdministrativeSituation } from '../forms/administrative-situation/administrative-situation';
import { DegreeWork } from '../forms/degree-work/degree-work';
import { ExtensionActivity } from '../forms/extension-activity/extension-activity';
import { InstitutionalProject } from '../forms/institutional-project/institutional-project';
import { PresetActivity } from '../forms/preset-activity/preset-activity';
import { ResearchProject } from '../forms/research-project/research-project';
import { Subject } from '../forms/subject/subject';
import { Support } from '../forms/support/support';

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

  readonly expanded = signal(false);

  readonly componentKey = computed(() => activityComponentKey(this.activity().componente));
}
