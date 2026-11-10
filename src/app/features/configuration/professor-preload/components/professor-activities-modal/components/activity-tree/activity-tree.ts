import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ActivityTypeNode, activityComponentKey } from '../../../../model/professor-activities.model';
import { Icon } from '../../../../../../../shared/ui/icon/icon';
import { AppIconName } from '../../../../../../../shared/ui/icon/icons';
import { ActivityCard } from '../activity-card/activity-card';

interface ActivitySectionIcon {
  name: AppIconName;
  badgeClass: string;
  iconClass: string;
}

const SECTION_ICON_BY_COMPONENTE: Record<string, ActivitySectionIcon> = {
  DOCENCIADIRECTA: {
    name: 'academicCap',
    badgeClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconClass: 'text-brand-600 dark:text-brand-400',
  },
  INVESTIGACION: {
    name: 'beaker',
    badgeClass: 'bg-warning-50 dark:bg-warning-500/10',
    iconClass: 'text-warning-600 dark:text-warning-400',
  },
  EXTENSION: {
    name: 'lightBulb',
    badgeClass: 'bg-success-50 dark:bg-success-500/10',
    iconClass: 'text-success-600 dark:text-success-400',
  },
  GESTIONINSTITUCIONAL: {
    name: 'briefcase',
    badgeClass: 'bg-gray-100 dark:bg-gray-800',
    iconClass: 'text-gray-700 dark:text-gray-200',
  },
};

const DEFAULT_SECTION_ICON: ActivitySectionIcon = {
  name: 'bookOpen',
  badgeClass: 'bg-gray-100 dark:bg-gray-800',
  iconClass: 'text-gray-700 dark:text-gray-200',
};

@Component({
  selector: 'app-activity-tree',
  imports: [ActivityTree, ActivityCard, Icon],
  templateUrl: './activity-tree.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTree {
  readonly nodes = input<ActivityTypeNode[]>([]);
  readonly depth = input(0);

  readonly listClass = computed(() => {
    if (this.depth() === 0) {
      return 'flex flex-col gap-8';
    }

    const grouped = this.nodes().some((node) => this.hasChildren(node));
    return grouped ? 'flex flex-col gap-5' : 'flex flex-col gap-3';
  });

  hasChildren(node: ActivityTypeNode): boolean {
    return (node.hijos?.length ?? 0) > 0;
  }

  sectionIcon(node: ActivityTypeNode): ActivitySectionIcon {
    const key = activityComponentKey(node.componente);
    return SECTION_ICON_BY_COMPONENTE[key] ?? DEFAULT_SECTION_ICON;
  }
}
