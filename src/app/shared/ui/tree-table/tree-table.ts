import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { Icon } from '../icon/icon';
import { Item } from '../dropdown/item/item';
import { Checkbox } from '../../components/form/input/checkbox';
import { formatSentenceValue } from '../../utils/normalized-text.util';
import {
  TreeTableActionEvent,
  TreeTableColumn,
  TreeTableNode,
  TreeTableRowAction,
  TreeTableToolbarActionEvent,
  TreeTableToolbarActionId,
} from './tree-table.types';

interface InternalTreeNode<T> {
  data: T;
  id: string | number;
  parentId: string | number | null;
  children: InternalTreeNode<T>[];
}

@Component({
  selector: 'app-tree-table',
  imports: [Icon, Checkbox, Item],
  templateUrl: './tree-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeTable<T> {
  private readonly cdr = inject(ChangeDetectorRef);

  columns = input.required<TreeTableColumn<T>[]>();
  rows = input<T[]>([]);
  rowActions = input<TreeTableRowAction<T>[]>([]);
  idKey = input<(row: T) => string | number>((row: any) => row.id);
  parentIdKey = input<(row: T) => string | number | null | undefined>((row: any) => row.idPadre);

  enableSelection = input(false);
  enableBulkActions = input(false);
  showDeleteButton = input(true);
  selectedRowKeys = model<Array<string | number>>([]);

  searchPlaceholder = input('Buscar...');
  emptyMessage = input('No hay registros.');
  showToolbar = input(true);
  showSearchInput = input(true);
  showAddButton = input(true);
  showRefreshButton = input(true);
  canAdd = input(true);
  defaultExpanded = input(true);

  action = output<TreeTableActionEvent<T>>();
  toolbarAction = output<TreeTableToolbarActionEvent<T>>();
  add = output<void>();
  refresh = output<void>();
  deleteAll = output<number[]>();
  selectedRowKeysChange = output<Array<string | number>>();
  selectedIdsChange = output<string[]>();

  readonly expandedNodeIds = signal<Set<string | number>>(new Set());
  readonly searchTerm = signal<string>('');
  private initializedDefaultExpansion = false;

  activeRowMenuKey: string | number | null = null;
  activeRowMenuRow: T | null = null;
  activeRowMenuRowIndex = -1;
  private activeRowTrigger: HTMLElement | null = null;
  rowMenuTop = 0;
  rowMenuLeft = 0;

  constructor() {
    effect(() => {
      const rows = this.rows();
      if (!this.initializedDefaultExpansion && rows.length > 0 && this.defaultExpanded()) {
        const idsWithChildren = new Set<string | number>();
        const parentGetter = this.parentIdKey();
        rows.forEach((r) => {
          const parentId = parentGetter(r);
          if (parentId != null) {
            idsWithChildren.add(parentId);
          }
        });
        this.expandedNodeIds.set(idsWithChildren);
        this.initializedDefaultExpansion = true;
      }
    });
  }

  private readonly treeHierarchy = computed(() => {
    const items = this.rows();
    const getId = this.idKey();
    const getParentId = this.parentIdKey();

    const nodeMap = new Map<string | number, InternalTreeNode<T>>();
    items.forEach((row) => {
      const id = getId(row);
      nodeMap.set(id, {
        data: row,
        id,
        parentId: getParentId(row) ?? null,
        children: [],
      });
    });

    const roots: InternalTreeNode<T>[] = [];
    nodeMap.forEach((node) => {
      if (node.parentId != null && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return { roots, nodeMap };
  });

  readonly visibleNodes = computed<TreeTableNode<T>[]>(() => {
    const { roots } = this.treeHierarchy();
    const query = this.searchTerm().trim().toLowerCase();
    const expanded = this.expandedNodeIds();
    const result: TreeTableNode<T>[] = [];

    if (!query) {
      const flatten = (nodes: InternalTreeNode<T>[], level: number) => {
        for (const node of nodes) {
          const isExpanded = expanded.has(node.id);
          const hasChildren = node.children.length > 0;
          result.push({
            data: node.data,
            id: node.id,
            parentId: node.parentId,
            level,
            isExpanded,
            hasChildren,
            childrenCount: node.children.length,
          });

          if (hasChildren && isExpanded) {
            flatten(node.children, level + 1);
          }
        }
      };

      flatten(roots, 0);
      return result;
    }

    const matchMap = new Map<string | number, { selfMatch: boolean; anyDescendantMatch: boolean }>();

    const checkMatches = (node: InternalTreeNode<T>): { selfMatch: boolean; anyDescendantMatch: boolean } => {
      const selfMatch = this.matchesSearch(node.data, query);
      let anyDescendantMatch = false;

      for (const child of node.children) {
        const childMatch = checkMatches(child);
        if (childMatch.selfMatch || childMatch.anyDescendantMatch) {
          anyDescendantMatch = true;
        }
      }

      const matchInfo = { selfMatch, anyDescendantMatch };
      matchMap.set(node.id, matchInfo);
      return matchInfo;
    };

    roots.forEach((root) => checkMatches(root));

    const flattenWithSearch = (nodes: InternalTreeNode<T>[], level: number) => {
      for (const node of nodes) {
        const matchInfo = matchMap.get(node.id);
        if (!matchInfo || (!matchInfo.selfMatch && !matchInfo.anyDescendantMatch)) {
          continue;
        }

        const hasChildren = node.children.length > 0;
        const isExpanded = matchInfo.anyDescendantMatch || expanded.has(node.id);

        result.push({
          data: node.data,
          id: node.id,
          parentId: node.parentId,
          level,
          isExpanded,
          hasChildren,
          childrenCount: node.children.length,
        });

        if (hasChildren && isExpanded) {
          flattenWithSearch(node.children, level + 1);
        }
      }
    };

    flattenWithSearch(roots, 0);
    return result;
  });

  toggleExpand(nodeId: string | number, event: MouseEvent): void {
    event.stopPropagation();
    const current = new Set(this.expandedNodeIds());
    if (current.has(nodeId)) {
      current.delete(nodeId);
    } else {
      current.add(nodeId);
    }
    this.expandedNodeIds.set(current);
  }

  expandAll(): void {
    const ids = new Set<string | number>();
    const { nodeMap } = this.treeHierarchy();
    nodeMap.forEach((node) => {
      if (node.children.length > 0) {
        ids.add(node.id);
      }
    });
    this.expandedNodeIds.set(ids);
  }

  collapseAll(): void {
    this.expandedNodeIds.set(new Set());
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value ?? '');
  }

  canDelete(): boolean {
    if (this.enableSelection()) {
      return this.selectedRowKeys().length > 0;
    }
    return this.visibleNodes().length > 0;
  }

  isRowSelected(node: TreeTableNode<T>): boolean {
    return this.selectedRowKeys().includes(node.id);
  }

  areAllVisibleRowsSelected(): boolean {
    const visible = this.visibleNodes();
    if (!visible.length) {
      return false;
    }
    const selected = new Set(this.selectedRowKeys());
    return visible.every((node) => selected.has(node.id));
  }

  onToggleRowSelection(node: TreeTableNode<T>, checked: boolean): void {
    const current = this.selectedRowKeys();
    const next = checked
      ? Array.from(new Set([...current, node.id]))
      : current.filter((key) => key !== node.id);

    this.updateSelection(next);
  }

  onToggleAllSelection(checked: boolean): void {
    const visibleKeys = this.visibleNodes().map((node) => node.id);
    const current = this.selectedRowKeys();
    const next = checked
      ? Array.from(new Set([...current, ...visibleKeys]))
      : current.filter((key) => !visibleKeys.includes(key));

    this.updateSelection(next);
  }

  private updateSelection(nextKeys: Array<string | number>): void {
    this.selectedRowKeys.set(nextKeys);
    this.selectedRowKeysChange.emit([...nextKeys]);
    this.selectedIdsChange.emit(nextKeys.map((k) => String(k)));
  }

  onToolbarAction(actionId: TreeTableToolbarActionId): void {
    if (actionId === 'refresh') {
      this.refresh.emit();
    } else if (actionId === 'add') {
      this.add.emit();
    } else if (actionId === 'deleteAll') {
      const ids = this.selectedRowKeys().map((k) => Number(k)).filter((n) => Number.isFinite(n));
      this.deleteAll.emit(ids);
    }

    const selectedKeys = new Set(this.selectedRowKeys());
    const selectedRows = this.rows().filter((row) => selectedKeys.has(this.idKey()(row)));

    this.toolbarAction.emit({
      actionId,
      rows: this.visibleNodes().map((n) => n.data),
      selectedRows,
      selectedRowKeys: [...this.selectedRowKeys()],
      selectedIds: this.selectedRowKeys().map((k) => String(k)),
      searchTerm: this.searchTerm(),
    });
  }

  isRowMenuOpen(rowKey: string | number): boolean {
    return this.activeRowMenuKey === rowKey;
  }

  openRowMenu(
    rowKey: string | number,
    row: T,
    rowIndex: number,
    event: MouseEvent,
  ): void {
    event.stopPropagation();

    if (this.activeRowMenuKey === rowKey) {
      this.closeRowMenu();
      return;
    }

    const trigger = event.currentTarget;
    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    this.activeRowMenuKey = rowKey;
    this.activeRowMenuRow = row;
    this.activeRowMenuRowIndex = rowIndex;
    this.activeRowTrigger = trigger;

    this.cdr.detectChanges();
    this.positionRowMenu();
  }

  closeRowMenu(): void {
    this.activeRowMenuKey = null;
    this.activeRowMenuRow = null;
    this.activeRowMenuRowIndex = -1;
    this.activeRowTrigger = null;
    this.rowMenuTop = 0;
    this.rowMenuLeft = 0;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeRowMenu();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.activeRowMenuKey !== null) {
      this.positionRowMenu();
    }
  }

  private positionRowMenu(): void {
    const trigger = this.activeRowTrigger;
    if (!trigger) return;

    const menu = document.querySelector('.row-action-menu') as HTMLElement | null;
    if (!menu) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    if (!menuRect.height || !menuRect.width) return;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spacing = 6;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    const openUp = spaceBelow < menuRect.height + spacing && spaceAbove > spaceBelow;

    let top = openUp ? triggerRect.top - menuRect.height - spacing : triggerRect.bottom + spacing;
    let left = triggerRect.right - menuRect.width;

    top = Math.max(
      spacing,
      Math.min(top, viewportHeight - menuRect.height - spacing),
    );
    left = Math.max(
      spacing,
      Math.min(left, viewportWidth - menuRect.width - spacing),
    );

    this.rowMenuTop = top;
    this.rowMenuLeft = left;
    this.cdr.detectChanges();
  }

  onRowActionItemClick(
    action: TreeTableRowAction<T>,
    row: T,
    _rowIndex: number,
  ): void {
    if (this.isActionDisabled(action, row)) {
      return;
    }

    const node = this.visibleNodes().find((n) => n.data === row) ?? {
      data: row,
      id: this.idKey()(row),
      parentId: this.parentIdKey()(row) ?? null,
      level: 0,
      isExpanded: false,
      hasChildren: false,
      childrenCount: 0,
    };

    this.action.emit({
      actionId: action.id,
      row,
      node,
    });
    this.closeRowMenu();
  }

  isActionVisible(action: TreeTableRowAction<T>, row: T): boolean {
    return action.visible ? action.visible(row) : true;
  }

  isActionDisabled(action: TreeTableRowAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  resolveActionTooltip(action: TreeTableRowAction<T>, row: T): string {
    if (typeof action.tooltip === 'function') {
      return action.tooltip(row);
    }
    return action.tooltip || action.label;
  }

  resolveCell(column: TreeTableColumn<T>, row: T): string {
    const raw = column.cell(row);
    if (column.formatAsSentence && !column.allowHtml) {
      return formatSentenceValue(raw);
    }
    return raw ?? '-';
  }

  private matchesSearch(row: T, query: string): boolean {
    return this.columns().some((col) => {
      const value = String(col.cell(row) ?? '').toLowerCase();
      return value.includes(query);
    });
  }
}
