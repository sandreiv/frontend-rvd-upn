/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 10/11/2026 - Leonel Antonio Perez Rios - Componente selector jerárquico tipo árbol con soporte de identación y expansión
 */
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  inject,
  input,
  model,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
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
export class TreeSelect implements ControlValueAccessor, OnInit, OnChanges {
  private readonly el = inject(ElementRef<HTMLElement>);
  triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerRef');

  items = input<unknown[]>([]);
  valueKey = input('id');
  labelKey = input('nombre');
  parentKey = input('idPadre');
  selectableKey = input('esSeleccionable');
  placeholder = input('Seleccione una opción');
  enableSearch = input(true);
  searchPlaceholder = input('Buscar...');
  emptyText = input('Sin resultados');
  className = input('');
  panelClassName = input('');
  disabled = input(false);
  defaultExpandedLevel = input(2);

  value = model<string>('');
  @Output() valueChange = new EventEmitter<string>();
  @Output() nodeSelected = new EventEmitter<unknown>();

  isOpen = signal(false);
  query = signal('');
  openUp = signal(false);
  panelStyles = signal<Record<string, string>>({});

  treeNodes = signal<TreeSelectNode[]>([]);
  expandedIds = signal<Set<string>>(new Set());

  buttonClasses = computed(() => {
    const base = this.className();
    if (this.disabled()) {
      return `relative pr-10 text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 ${base}`;
    }
    return `relative pr-10 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800 ${base}`;
  });

  private onChangeFn: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  ngOnInit(): void {
    if (this.treeNodes().length === 0 && this.items().length > 0) {
      this.buildTree();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['items'] ||
      changes['valueKey'] ||
      changes['labelKey'] ||
      changes['parentKey'] ||
      changes['selectableKey']
    ) {
      this.buildTree();
    }
  }

  writeValue(value: string | number | null | undefined): void {
    const next = value == null ? '' : String(value);
    this.value.set(next);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    (this.disabled as unknown as { set?: (v: boolean) => void }).set?.(isDisabled);
  }

  toggle(): void {
    if (this.disabled()) {
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
    this.openUp.set(false);
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) {
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

  get selectedLabel(): string {
    const currentVal = this.value();
    if (!currentVal) {
      return '';
    }
    const found = this.findNodeInFlatList(currentVal);
    return found ? found.label : '';
  }

  get selectedPath(): string {
    const currentVal = this.value();
    if (!currentVal) {
      return '';
    }
    const path: string[] = [];
    let current: TreeSelectNode | null = this.findNodeInFlatList(currentVal);
    while (current) {
      path.unshift(current.label);
      current = current.idPadre ? this.findNodeInFlatList(current.idPadre) : null;
    }
    return path.join(' > ');
  }

  get flatDisplayNodes(): FlatTreeNode[] {
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

    const checkMatch = (nodeList: TreeSelectNode[], parentChain: string[]): boolean => {
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

  private buildTree(): void {
    const rawList = this.items();
    if (!rawList || rawList.length === 0) {
      this.treeNodes.set([]);
      this.expandedIds.set(new Set());
      return;
    }

    const vKey = this.valueKey();
    const lKey = this.labelKey();
    const pKey = this.parentKey();
    const sKey = this.selectableKey();

    const nodeMap = new Map<string, TreeSelectNode>();
    const rootNodes: TreeSelectNode[] = [];
    const initialExpanded = new Set<string>();

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
        parentVal != null && parentVal !== '' && parentVal !== 0 ? String(parentVal) : null;
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

    const setLevelAndDefaults = (nodes: TreeSelectNode[], currentLevel: number) => {
      for (const node of nodes) {
        node.level = currentLevel;
        if (currentLevel < this.defaultExpandedLevel() && node.hasChildren) {
          initialExpanded.add(node.id);
        }
        if (node.hasChildren) {
          setLevelAndDefaults(node.children, currentLevel + 1);
        }
      }
    };

    setLevelAndDefaults(rootNodes, 0);

    this.treeNodes.set(rootNodes);
    this.expandedIds.set(initialExpanded);
  }

  private findNodeInFlatList(id: string): TreeSelectNode | null {
    const search = (nodes: TreeSelectNode[]): TreeSelectNode | null => {
      for (const n of nodes) {
        if (n.id === id) {
          return n;
        }
        if (n.children.length > 0) {
          const childFound = search(n.children);
          if (childFound) {
            return childFound;
          }
        }
      }
      return null;
    };
    return search(this.treeNodes());
  }

  private positionPanel(): void {
    const trigger = this.triggerRef()?.nativeElement;
    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spacing = 6;
    const preferredHeight = 340;
    const spaceBelow = viewportHeight - rect.bottom - spacing;
    const spaceAbove = rect.top - spacing;
    const shouldOpenUp = spaceBelow < 240 && spaceAbove > spaceBelow;

    this.openUp.set(shouldOpenUp);

    if (shouldOpenUp) {
      this.panelStyles.set({
        display: 'flex',
        'flex-direction': 'column',
        left: `${Math.round(rect.left)}px`,
        width: `${Math.round(rect.width)}px`,
        bottom: `${Math.max(spacing, Math.round(viewportHeight - rect.top + spacing))}px`,
        'max-height': `${Math.max(180, Math.min(preferredHeight, spaceAbove - spacing))}px`,
      });
      return;
    }

    this.panelStyles.set({
      display: 'flex',
      'flex-direction': 'column',
      left: `${Math.round(rect.left)}px`,
      width: `${Math.round(rect.width)}px`,
      top: `${Math.round(rect.bottom + spacing)}px`,
      'max-height': `${Math.max(180, Math.min(preferredHeight, spaceBelow - spacing))}px`,
    });
  }
}
