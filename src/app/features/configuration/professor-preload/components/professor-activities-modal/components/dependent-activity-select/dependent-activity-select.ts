import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { forNext } from '../../../../../../../core/utils/for-next.function';
import { Label } from '../../../../../../../shared/components/form/label/label';
import { Option, Select } from '../../../../../../../shared/components/form/select/select';
import {
  ActivityTypeNode,
  dependentActivityNodes,
} from '../../../../model/professor-activities.model';

interface DependentLevel {
  parentId: number;
  label: string;
  options: Option[];
  selected: string;
}

@Component({
  selector: 'app-dependent-activity-select',
  imports: [Label, Select],
  templateUrl: './dependent-activity-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DependentActivitySelect {
  readonly activity = input.required<ActivityTypeNode>();

  private readonly selectedIds = signal<string[]>([]);

  readonly levels = computed(() => this.buildLevels(this.activity(), this.selectedIds()));

  onSelect(index: number, value: string): void {
    this.selectedIds.update((current) => {
      const next = current.slice(0, index);
      if (value) {
        next.push(value);
      }
      return next;
    });
  }

  private buildLevels(root: ActivityTypeNode, selectedIds: string[]): DependentLevel[] {
    const levels: DependentLevel[] = [];
    const visited = new Set<number>();
    let parentId = root.id;
    let label = 'Actividad';
    let index = 0;

    while (!visited.has(parentId)) {
      visited.add(parentId);
      const dependents = dependentActivityNodes(root, parentId);
      if (dependents.length === 0) {
        break;
      }

      const selected = selectedIds[index] ?? '';
      levels.push({
        parentId,
        label,
        selected,
        options: this.toOptions(dependents),
      });

      const chosen = dependents.find((node) => String(node.id) === selected);
      if (!chosen) {
        break;
      }

      label = chosen.nombre?.trim() || 'Actividad';
      parentId = chosen.id;
      index += 1;
    }

    return levels;
  }

  private toOptions(nodes: ActivityTypeNode[]): Option[] {
    const options: Option[] = [];
    forNext(nodes, (node) => {
      options.push({
        value: String(node.id),
        label: node.nombre?.trim() || 'Actividad',
      });
    });
    return options;
  }
}
