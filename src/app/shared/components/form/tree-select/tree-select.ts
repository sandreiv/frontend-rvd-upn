/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 10/11/2026 - Leonel Antonio Perez Rios - Componente selector jerárquico tipo árbol con soporte de identación y expansión
 * 10/11/2026 - Leonel Antonio Perez Rios - Refactorización: uso de señales computadas, eliminación de código obsoleto y constantes limpias
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../../../ui/icon/icon';
import { formatSentenceValue } from '../../../utils/normalized-text.util';

export interface TreeSelectNode {
  id: string;
  label: string;
  idPadre?: string | null;
  selectable: boolean;
  disabled?: boolean;
  level: number;
  expanded: boolean;
  hasChildren: boolean;
  children: TreeSelectNode[];
  raw: unknown;
}

export interface FlatTreeNode {
  id: string;
  label: string;
  idPadre?: string | null;
  selectable: boolean;
  disabled?: boolean;
  level: number;
  expanded: boolean;
  hasChildren: boolean;
  raw: unknown;
}

const PANEL_SPACING = 6;
const PREFERRED_PANEL_HEIGHT = 340;
const MIN_PANEL_HEIGHT = 180;
const MIN_SPACE_BELOW_FOR_DOWNWARDS = 240;
const INDENT_BASE_REM = 0.75;
const INDENT_LEVEL_REM = 1.25;

@Component({
  selector: 'app-tree-select',
  imports: [CommonModule, Icon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TreeSelect),
      multi: true,
    },
  ],
  templateUrl: './tree-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeSelect implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerRef');

  readonly items = input<unknown[]>([]);
  readonly valueKey = input('id');
  readonly labelKey = input('nombre');
  readonly parentKey = input('idPadre');
  readonly selectableKey = input('esSeleccionable');
  readonly placeholder = input('Seleccione una opción');
  readonly enableSearch = input(true);
  readonly searchPlaceholder = input('Buscar...');
  readonly emptyText = input('Sin resultados');
  readonly className = input('');
  readonly panelClassName = input('');
  readonly disabled = input(false);
  readonly defaultExpandedLevel = input(2);

  readonly value = model<string>('');
  @Output() readonly valueChange = new EventEmitter<string>();
  @Output() readonly nodeSelected = new EventEmitter<unknown>();

  readonly isOpen = signal(false);
  readonly query = signal('');
  readonly panelStyles = signal<Record<string, string>>({});
  readonly expandedIds = signal<Set<string>>(new Set());
  private readonly cvaDisabled = signal(false);

  readonly effectiveDisabled = computed(
    () => this.disabled() || this.cvaDisabled(),
  );

  private onChangeFn: (value: string) => void = () => {};
  private onTouchedFn: () => void = () => {};

  readonly treeNodes = computed<TreeSelectNode[]>(() => {
    const rawList = this.items();
    if (!rawList || rawList.length === 0) {
      return [];
    }

    const vKey = this.valueKey();
    const lKey = this.labelKey();
    const pKey = this.parentKey();
    const sKey = this.selectableKey();

    const nodeMap = new Map<string, TreeSelectNode>();
    const rootNodes: TreeSelectNode[] = [];

    for (const raw of rawList) {
      const rec = (raw ?? {}) as Record<string, unknown>;
      const idVal = rec[vKey];
      if (idVal == null) {
        continue;
      }

      const id = String(idVal);
      const label = formatSentenceValue(String(rec[lKey] ?? id));
      const parentVal = rec[pKey];
      const idPadre =
        parentVal != null && parentVal !== '' && parentVal !== 0
          ? String(parentVal)
          : null;
      const selectable = rec[sKey] != null ? Boolean(rec[sKey]) : true;

      const node: TreeSelectNode = {
        id,
        label,
        idPadre,
        selectable,
        disabled: Boolean(rec['disabled']),
        level: 0,
        expanded: false,
        hasChildren: false,
        children: [],
        raw,
      };
      nodeMap.set(id, node);
    }

    for (const node of nodeMap.values()) {
      if (node.idPadre && nodeMap.has(node.idPadre)) {
        const parent = nodeMap.get(node.idPadre)!;
        parent.children.push(node);
        parent.hasChildren = true;
      } else {
        rootNodes.push(node);
      }
    }

    const assignLevels = (nodes: TreeSelectNode[], currentLevel: number) => {
      for (const node of nodes) {
        node.level = currentLevel;
        if (node.hasChildren) {
          assignLevels(node.children, currentLevel + 1);
        }
      }
    };
    assignLevels(rootNodes, 0);

    return rootNodes;
  });

  readonly flatNodesMap = computed<Map<string, TreeSelectNode>>(() => {
    const map = new Map<string, TreeSelectNode>();
    const collect = (nodes: TreeSelectNode[]) => {
      for (const n of nodes) {
        map.set(n.id, n);
        if (n.hasChildren) {
          collect(n.children);
        }
      }
    };
    collect(this.treeNodes());
    return map;
  });

  readonly selectedNode = computed<TreeSelectNode | null>(() => {
    const currentVal = this.value();
    if (!currentVal) {
      return null;
    }
    return this.flatNodesMap().get(currentVal) ?? null;
  });

  readonly selectedLabel = computed<string>(() => {
    return this.selectedNode()?.label ?? '';
  });

  readonly selectedPath = computed<string>(() => {
    const node = this.selectedNode();
    if (!node) {
      return '';
    }

    const path: string[] = [];
    const map = this.flatNodesMap();
    let current: TreeSelectNode | null = node;

    while (current) {
      path.unshift(current.label);
      current = current.idPadre ? map.get(current.idPadre) ?? null : null;
    }

    return path.join(' > ');
  });

  readonly flatDisplayNodes = computed<FlatTreeNode[]>(() => {
    const q = this.query().trim().toLocaleLowerCase('es-CO');
    const nodes = this.treeNodes();
    const expanded = this.expandedIds();

    if (!q) {
      const list: FlatTreeNode[] = [];
      const traverse = (nodeList: TreeSelectNode[]) => {
        for (const node of nodeList) {
          const isExpanded = expanded.has(node.id);
          list.push({
            id: node.id,
            label: node.label,
            idPadre: node.idPadre,
            selectable: node.selectable,
            disabled: node.disabled,
            level: node.level,
            expanded: isExpanded,
            hasChildren: node.hasChildren,
            raw: node.raw,
          });

          if (node.hasChildren && isExpanded) {
            traverse(node.children);
          }
        }
      };
      traverse(nodes);
      return list;
    }

    const matchingIds = new Set<string>();
    const ancestorIds = new Set<string>();

    const checkMatch = (
      nodeList: TreeSelectNode[],
      parentChain: string[],
    ): boolean => {
      let anyChildMatched = false;
      for (const node of nodeList) {
        const matchesSelf = node.label.toLocaleLowerCase('es-CO').includes(q);
        const nextChain = [...parentChain, node.id];
        const childMatched = checkMatch(node.children, nextChain);

        if (matchesSelf || childMatched) {
          matchingIds.add(node.id);
          for (const ancestorId of parentChain) {
            ancestorIds.add(ancestorId);
          }
          anyChildMatched = true;
        }
      }
      return anyChildMatched;
    };

    checkMatch(nodes, []);

    const list: FlatTreeNode[] = [];
    const traverseFiltered = (nodeList: TreeSelectNode[]) => {
      for (const node of nodeList) {
        if (!matchingIds.has(node.id) && !ancestorIds.has(node.id)) {
          continue;
        }
        list.push({
          id: node.id,
          label: node.label,
          idPadre: node.idPadre,
          selectable: node.selectable,
          disabled: node.disabled,
          level: node.level,
          expanded: true,
          hasChildren: node.hasChildren,
          raw: node.raw,
        });

        if (node.hasChildren) {
          traverseFiltered(node.children);
        }
      }
    };

    traverseFiltered(nodes);
    return list;
  });

  readonly buttonClasses = computed(() => {
    const base = this.className();
    if (this.effectiveDisabled()) {
      return `relative pr-10 text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 ${base}`;
    }
    return `relative pr-10 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800 ${base}`;
  });

  constructor() {
    effect(() => {
      const nodes = this.treeNodes();
      const maxLevel = this.defaultExpandedLevel();
      const initial = new Set<string>();

      const collect = (list: TreeSelectNode[]) => {
        for (const node of list) {
          if (node.hasChildren && node.level < maxLevel) {
            initial.add(node.id);
            collect(node.children);
          }
        }
      };

      collect(nodes);
      this.expandedIds.set(initial);
    });
  }

  writeValue(value: string | number | null | undefined): void {
    this.value.set(value == null ? '' : String(value));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.cvaDisabled.set(isDisabled);
  }

  onBlur(): void {
    this.onTouchedFn();
  }

  toggle(): void {
    if (this.effectiveDisabled()) {
      return;
    }
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.query.set('');
      this.positionPanel();
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.query.set('');
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    if (this.effectiveDisabled()) {
      return;
    }
    this.value.set('');
    this.onChangeFn('');
    this.valueChange.emit('');
    this.nodeSelected.emit(null);
  }

  toggleNode(nodeId: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.expandedIds.update((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }

  onNodeClick(node: FlatTreeNode): void {
    if (node.disabled) {
      return;
    }

    if (!node.selectable && node.hasChildren) {
      this.toggleNode(node.id);
      return;
    }

    if (!node.selectable) {
      return;
    }

    this.value.set(node.id);
    this.onChangeFn(node.id);
    this.valueChange.emit(node.id);
    this.nodeSelected.emit(node.raw);
    this.close();
  }

  onQueryInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    this.query.set(inputEl.value);
  }

  getNodePaddingRem(level: number): number {
    return INDENT_BASE_REM + level * INDENT_LEVEL_REM;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen()) {
      this.positionPanel();
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }
    const target = event.target as Node | null;
    const root = this.el.nativeElement;
    if (root && target && !root.contains(target)) {
      this.close();
    }
  }

  private positionPanel(): void {
    const trigger = this.triggerRef()?.nativeElement;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom - PANEL_SPACING;
    const spaceAbove = rect.top - PANEL_SPACING;
    const openUpwards =
      spaceBelow < MIN_SPACE_BELOW_FOR_DOWNWARDS && spaceAbove > spaceBelow;

    if (openUpwards) {
      this.panelStyles.set({
        left: `${Math.round(rect.left)}px`,
        width: `${Math.round(rect.width)}px`,
        bottom: `${Math.max(PANEL_SPACING, Math.round(viewportHeight - rect.top + PANEL_SPACING))}px`,
        'max-height': `${Math.max(MIN_PANEL_HEIGHT, Math.min(PREFERRED_PANEL_HEIGHT, spaceAbove - PANEL_SPACING))}px`,
      });
      return;
    }

    this.panelStyles.set({
      left: `${Math.round(rect.left)}px`,
      width: `${Math.round(rect.width)}px`,
      top: `${Math.round(rect.bottom + PANEL_SPACING)}px`,
      'max-height': `${Math.max(MIN_PANEL_HEIGHT, Math.min(PREFERRED_PANEL_HEIGHT, spaceBelow - PANEL_SPACING))}px`,
    });
  }
}
