import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { TabBar } from '../../../../../shared/ui/tab-bar/tab-bar';
import {
  TabBarId,
  TabBarItem,
} from '../../../../../shared/ui/tab-bar/tab-bar.types';
import { CoordinationService } from '../../data/coordination.service';
import { CoordinationItem } from '../../model/coordination.model';
import {
  LinkageTypeItem,
  linkageTypeLabel,
} from '../../model/linkage-type.model';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { ProfessorAddModal } from '../professor-add-modal/professor-add-modal';

@Component({
  selector: 'app-linkage-type',
  imports: [TabBar, Button, Icon, ProfessorAddModal],
  templateUrl: './linkage-type.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkageType {
  private readonly coordinationService = inject(CoordinationService);

  readonly coordination = input.required<CoordinationItem>();
  readonly selectedLinkageTypeId = signal<TabBarId | null>(null);
  readonly isProfessorAddModalOpen = signal(false);

  readonly linkageTypesResource = rxResource({
    params: () => {
      const idConvocatoria = this.coordination().idConvocatoria;
      if (idConvocatoria == null) {
        return undefined;
      }

      return { idConvocatoria };
    },
    stream: ({ params }) =>
      this.coordinationService.listLinkageTypes(params.idConvocatoria),
    defaultValue: [] as LinkageTypeItem[],
  });

  readonly linkageTypes = computed(() => this.linkageTypesResource.value());

  readonly isLoadingLinkageTypes = computed(() =>
    this.linkageTypesResource.isLoading(),
  );

  readonly linkageTypeTabs = computed<TabBarItem[]>(() =>
    this.linkageTypes().map((item) => ({
      id: item.id,
      label: linkageTypeLabel(item),
    })),
  );

  readonly hasAnyLinkageType = computed(
    () => this.linkageTypeTabs().length > 0,
  );

  readonly selectedLinkageType = computed(() => {
    const selectedId = this.selectedLinkageTypeId();
    return (
      this.linkageTypes().find((item) => item.id === selectedId) ?? null
    );
  });

  constructor() {
    effect(() => {
      const tabs = this.linkageTypeTabs();
      const currentId = this.selectedLinkageTypeId();

      if (!tabs.length) {
        this.selectedLinkageTypeId.set(null);
        return;
      }

      const hasCurrent = tabs.some((tab) => tab.id === currentId);
      if (!hasCurrent) {
        this.selectedLinkageTypeId.set(tabs[0].id);
      }
    });
  }

  onLinkageTypeChange(linkageTypeId: TabBarId | null): void {
    this.selectedLinkageTypeId.set(linkageTypeId);
  }

  onProfessorAddModalOpen(): void {
    this.isProfessorAddModalOpen.set(true);
  }

  closeProfessorAddModal(): void {
    this.isProfessorAddModalOpen.set(false);
  }
}
