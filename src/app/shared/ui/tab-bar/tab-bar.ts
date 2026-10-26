import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import {
  TAB_BAR_DEFAULT_ACCENTS,
  TabBarAccent,
  TabBarId,
  TabBarItem,
} from './tab-bar.types';

@Component({
  selector: 'app-tab-bar',
  imports: [NgClass],
  templateUrl: './tab-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBar {
  items = input<TabBarItem[]>([]);
  selectedId = model<TabBarId | null>(null);

  private readonly dotColors: Record<TabBarAccent, string> = {
    brand: 'bg-brand-500',
    brandDeep: 'bg-brand-700',
    brandLight: 'bg-brand-400',
    brandStrong: 'bg-brand-600',
    brandSoft: 'bg-brand-300',
  };

  private readonly activeBorders: Record<TabBarAccent, string> = {
    brand: 'border-brand-500',
    brandDeep: 'border-brand-700',
    brandLight: 'border-brand-400',
    brandStrong: 'border-brand-600',
    brandSoft: 'border-brand-300',
  };

  selectTab(id: TabBarId): void {
    this.selectedId.set(id);
  }

  isSelected(id: TabBarId): boolean {
    return this.selectedId() === id;
  }

  dotClass(item: TabBarItem, index: number): string {
    return this.dotColors[this.resolveAccent(item, index)];
  }

  borderClass(item: TabBarItem, index: number): string {
    if (!this.isSelected(item.id)) {
      return 'border-transparent';
    }

    return this.activeBorders[this.resolveAccent(item, index)];
  }

  private resolveAccent(item: TabBarItem, index: number): TabBarAccent {
    if (item.accent) {
      return item.accent;
    }

    return TAB_BAR_DEFAULT_ACCENTS[index % TAB_BAR_DEFAULT_ACCENTS.length];
  }
}
