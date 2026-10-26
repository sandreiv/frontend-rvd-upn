import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  SimpleChanges,
  OnChanges,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableFileTypeIconClickEvent,
  DataTableInlineIcon,
  DataTableRowAction,
  DataTableSearchEvent,
  DataTableSelectionChangeEvent,
  DataTableSortDirection,
  DataTableSortValue,
  DataTableToolbarActionEvent,
  DataTableToolbarActionId,
} from './table.types';
import { getFileExtension, getFileTypeIconPath } from '../../utils/file-type-icon.util';
import { Icon } from '../icon/icon';
import { Item } from '../dropdown/item/item';
import { Checkbox } from '../../components/form/input/checkbox';
import { Tooltip } from '../tooltip/tooltip';
import { formatSentenceValue } from '../../utils/normalized-text.util';
import { formatCurrencyValue } from '../../utils/currency.util';

@Component({
  selector: 'app-data-table',
  standalone: true,
  templateUrl: './data-table.html',
  imports: [Icon, Item, Checkbox, Tooltip],
})
export class DataTable<T = unknown> implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('sentinelElement') sentinelElement?: ElementRef<HTMLDivElement>;
  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('rowActionMenu') rowActionMenu?: ElementRef<HTMLDivElement>;
  @Input() canAdd = true;
  @Input() columns: DataTableColumn<T>[] = [];
  @Input() rows: T[] = [];
  @Input() rowActions: DataTableRowAction<T>[] = [];
  @Input() inlineIcons: DataTableInlineIcon<T>[] = [];
  @Input() emptyMessage = 'No hay registros para mostrar.';
  @Input() rowIdentity: (row: T, index: number) => string | number = (_row, index) => index;
  @Input() showToolbar = true;
  @Input() showRefreshButton = true;
  @Input() showDeleteButton = true;
  @Input() showAddButton = true;
  @Input() showSearchInput = true;
  @Input() searchPlaceholder = 'Buscar...';
  @Input() searchPredicate?: (row: T, term: string) => boolean;
  @Input() useFixedLayout = false;
  @Input() wrapCellText = false;
  @Input() embedded = false;

  @Input() enableSelection = false;
  @Input() enableBulkActions = false;
  @Input() selectedRowKeys: Array<string | number> = [];
  @Input() selectedIds: string[] = [];

  //Scroll infinito: LP: 30-004-2026
  @Input() enableInfiniteScroll = false;
  @Input() blockSize = 10;
  @Input() isLoadingMore = false;
  @Input() tableMaxHeight = '500px';
  @Input() hasMore = true;
  @Input() endOfListMessage = 'Has llegado al final de la lista.';

  @Output() rowAction = new EventEmitter<DataTableActionEvent<T>>();
  @Output() toolbarAction = new EventEmitter<DataTableToolbarActionEvent<T>>();
  @Output() searchChange = new EventEmitter<DataTableSearchEvent<T>>();
  @Output() selectedRowKeysChange = new EventEmitter<Array<string | number>>();
  @Output() selectedIdsChange = new EventEmitter<string[]>();
  @Output() selectionChange = new EventEmitter<DataTableSelectionChangeEvent<T>>();
  @Output() fileTypeIconClick = new EventEmitter<DataTableFileTypeIconClickEvent<T>>();

  //Scroll infinito: LP: 30-004-2026
  @Output() loadMore = new EventEmitter<{ blockIndex: number; offset: number }>();

  activeRowMenuKey: string | number | null = null;
  activeRowMenuRow: T | null = null;
  activeRowMenuRowIndex = -1;
  rowMenuTop = 0;
  rowMenuLeft = 0;
  searchTerm = '';
  activeSortColumnId: string | null = null;
  activeSortDirection: DataTableSortDirection | null = null;

  //Scroll infinito: LP: 30-004-2026
  private readonly cdr = inject(ChangeDetectorRef);
  private intersectionObserver: IntersectionObserver | null = null;
  private currentBlockIndex = 0;
  private scrollListener: (() => void) | null = null;
  private isLoadMorePending = false;
  private activeRowTrigger: HTMLElement | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['isLoadingMore'] &&
      changes['isLoadingMore'].previousValue === true &&
      changes['isLoadingMore'].currentValue === false
    ) {
      this.isLoadMorePending = false;
    }
  }

  resolveCell(column: DataTableColumn<T>, row: T): string {
    const rawValue = column.cell(row);
    return this.formatCellValue(rawValue, column);
  }

  fileTypeIconPath(column: DataTableColumn<T>, row: T): string {
    return getFileTypeIconPath(String(column.cell(row) ?? ''));
  }

  fileTypeIconAltText(column: DataTableColumn<T>, row: T): string {
    return `Tipo de archivo ${getFileExtension(String(column.cell(row) ?? ''))}`;
  }

  onFileTypeIconAction(column: DataTableColumn<T>, row: T, rowIndex: number): void {
    this.fileTypeIconClick.emit({
      row,
      columnId: column.id,
      fileName: String(column.cell(row) ?? '').trim() || 'documento',
      rowKey: this.resolveFilteredRowKey(row, rowIndex),
      rowIndex,
    });
  }

  isActionVisible(action: DataTableRowAction<T>, row: T): boolean {
    return action.visible ? action.visible(row) : true;
  }

  isActionDisabled(action: DataTableRowAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  resolveActionTooltip(action: DataTableRowAction<T>, row: T): string {
    if (!action.tooltip) {
      return '';
    }

    return typeof action.tooltip === 'function'
      ? action.tooltip(row)
      : action.tooltip;
  }

  onRowActionItemClick(
    action: DataTableRowAction<T>,
    row: T,
    rowIndex: number,
  ): void {
    if (this.isActionDisabled(action, row)) {
      return;
    }

    this.emitRowAction(action.id, row, rowIndex);
    this.closeRowMenu();
  }

  isInlineIconVisible(icon: DataTableInlineIcon<T>, row: T): boolean {
    return icon.visible ? icon.visible(row) : true;
  }

  emitRowAction(actionId: string, row: T, rowIndex: number): void {
    this.rowAction.emit({
      actionId,
      row,
      rowIndex,
      rowKey: this.resolveFilteredRowKey(row, rowIndex),
    });
  }

  resolveRowKey(row: T, index: number): string | number {
    return this.rowIdentity(row, index);
  }

  resolveFilteredRowKey(row: T, filteredIndex: number): string | number {
    return this.resolveRowKey(row, this.resolveSourceIndex(row, filteredIndex));
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

  private positionRowMenu() {
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

    const openUp = (spaceBelow < menuRect.height + spacing) && (spaceAbove > spaceBelow);

    let top = openUp ? (triggerRect.top - menuRect.height - spacing) : (triggerRect.bottom + spacing);
    let left = triggerRect.right - menuRect.width;

    top = Math.max(
      spacing,
      Math.min(top, viewportHeight - menuRect.height - spacing)
    );
    left = Math.max(
      spacing,
      Math.min(left, viewportWidth - menuRect.width - spacing)
    );

    this.rowMenuTop = top;
    this.rowMenuLeft = left;
  }

  onToolbarAction(actionId: DataTableToolbarActionId): void {
    this.toolbarAction.emit({
      actionId,
      rows: this.filteredRows(),
      selectedRows: this.getSelectedRows(),
      selectedRowKeys: [...this.selectedRowKeys],
      selectedIds: this.selectedIds,
      searchTerm: this.normalizedSearchTerm,
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.searchTerm = input?.value ?? '';
    this.emitSearchChange();
  }

  toggleSort(column: DataTableColumn<T>): void {
    if (!this.isColumnSortable(column)) {
      return;
    }

    if (this.activeSortColumnId !== column.id) {
      this.activeSortColumnId = column.id;
      this.activeSortDirection = 'asc';
      return;
    }

    if (this.activeSortDirection === 'asc') {
      this.activeSortDirection = 'desc';
      return;
    }

    this.activeSortColumnId = null;
    this.activeSortDirection = null;
  }

  isColumnSortable(column: DataTableColumn<T>): boolean {
    return column.sortable !== false;
  }

  isColumnSorted(column: DataTableColumn<T>): boolean {
    return this.activeSortColumnId === column.id && this.activeSortDirection !== null;
  }

  isColumnSortedAsc(column: DataTableColumn<T>): boolean {
    return this.activeSortColumnId === column.id && this.activeSortDirection === 'asc';
  }

  isColumnSortedDesc(column: DataTableColumn<T>): boolean {
    return this.activeSortColumnId === column.id && this.activeSortDirection === 'desc';
  }

  sortAriaLabel(column: DataTableColumn<T>): string {
    if (!this.isColumnSorted(column)) {
      return `Ordenar por ${column.header} ascendente`;
    }

    if (this.activeSortDirection === 'asc') {
      return `Ordenar por ${column.header} descendente`;
    }

    return `Quitar ordenamiento por ${column.header}`;
  }

  ariaSort(column: DataTableColumn<T>): 'ascending' | 'descending' | 'none' {
    if (this.isColumnSortedAsc(column)) {
      return 'ascending';
    }

    if (this.isColumnSortedDesc(column)) {
      return 'descending';
    }

    return 'none';
  }

  filteredRows(): T[] {
    const searchTerm = this.normalizedSearchTerm;

    const visibleRows = searchTerm
      ? this.rows.filter((row) => this.matchesSearch(row, searchTerm))
      : this.rows;

    return this.sortRows(visibleRows);
  }

  canDelete(): boolean {
    if (this.enableSelection) {
      return this.selectedRowKeys.length > 0;
    }

    return this.filteredRows().length > 0;
  }

  isRowSelected(row: T, filteredIndex: number): boolean {
    const rowKey = this.resolveFilteredRowKey(row, filteredIndex);
    return this.selectedRowKeys.includes(rowKey);
  }

  areAllVisibleRowsSelected(): boolean {
    const visibleRows = this.filteredRows();

    if (!visibleRows.length) {
      return false;
    }

    return visibleRows.every((row, index) =>
      this.selectedRowKeys.includes(this.resolveFilteredRowKey(row, index)),
    );
  }

  onToggleRowSelection(row: T, filteredIndex: number, checked: boolean): void {
    const rowKey = this.resolveFilteredRowKey(row, filteredIndex);

    const nextKeys = checked
      ? Array.from(new Set([...this.selectedRowKeys, rowKey]))
      : this.selectedRowKeys.filter((key) => key !== rowKey);

    this.updateSelection(nextKeys);
  }

  onToggleAllSelection(checked: boolean): void {
    const visibleKeys = this.filteredRows().map((row, index) =>
      this.resolveFilteredRowKey(row, index),
    );

    const nextKeys = checked
      ? Array.from(new Set([...this.selectedRowKeys, ...visibleKeys]))
      : this.selectedRowKeys.filter((key) => !visibleKeys.includes(key));

    this.updateSelection(nextKeys);
  }

  getSelectedRows(): T[] {
    const selectedKeys = new Set(this.selectedRowKeys);

    return this.rows.filter((row, index) => selectedKeys.has(this.resolveRowKey(row, index)));
  }

  private resolveSourceIndex(row: T, fallbackIndex: number): number {
    const sourceIndex = this.rows.indexOf(row);
    return sourceIndex >= 0 ? sourceIndex : fallbackIndex;
  }

  private updateSelection(nextKeys: Array<string | number>): void {
    this.selectedRowKeys = nextKeys;
    this.selectedIds = nextKeys.map((key) => String(key));
    this.selectedRowKeysChange.emit([...nextKeys]);
    this.selectedIdsChange.emit([...this.selectedIds]);
    this.selectionChange.emit({
      selectedRowKeys: [...nextKeys],
      selectedRows: this.getSelectedRows(),
      allVisibleSelected: this.areAllVisibleRowsSelected(),
    });
  }

  private get normalizedSearchTerm(): string {
    return this.searchTerm.trim().toLowerCase();
  }

  private emitSearchChange(): void {
    this.searchChange.emit({
      searchTerm: this.normalizedSearchTerm,
      rows: this.filteredRows(),
    });
  }

  private matchesSearch(row: T, searchTerm: string): boolean {
    if (this.searchPredicate) {
      return this.searchPredicate(row, searchTerm);
    }

    return this.columns.some((column) =>
      this.resolveCell(column, row).toLowerCase().includes(searchTerm),
    );
  }

  private sortRows(rows: T[]): T[] {
    if (!this.activeSortColumnId || !this.activeSortDirection) {
      return rows;
    }

    const column = this.columns.find((item) => item.id === this.activeSortColumnId);

    if (!column) {
      return rows;
    }

    const direction = this.activeSortDirection === 'asc' ? 1 : -1;

    return [...rows].sort((leftRow, rightRow) => {
      const result = this.compareRowsByColumn(leftRow, rightRow, column);
      return result * direction;
    });
  }

  private compareRowsByColumn(
    leftRow: T,
    rightRow: T,
    column: DataTableColumn<T>,
  ): number {
    const leftValue = this.normalizeSortValue(this.resolveSortValue(column, leftRow), column);
    const rightValue = this.normalizeSortValue(this.resolveSortValue(column, rightRow), column);

    const leftEmpty = leftValue === null;
    const rightEmpty = rightValue === null;

    if (leftEmpty && rightEmpty) {
      return 0;
    }

    if (leftEmpty) {
      return 1;
    }

    if (rightEmpty) {
      return -1;
    }

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return leftValue - rightValue;
    }

    return String(leftValue).localeCompare(String(rightValue), 'es', {
      numeric: true,
      sensitivity: 'base',
    });
  }

  private resolveSortValue(column: DataTableColumn<T>, row: T): DataTableSortValue {
    if (column.sortValue) {
      return column.sortValue(row);
    }

    return column.cell(row);
  }

  private normalizeSortValue(
    value: DataTableSortValue,
    column: DataTableColumn<T>,
  ): string | number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.getTime();
    }

    if (typeof value === 'number') {
      return Number.isNaN(value) ? null : value;
    }

    const normalized = String(value).trim();

    if (!normalized || normalized === '-') {
      return null;
    }

    if (column.formatAsDate) {
      const timestamp = this.parseDateValue(normalized);
      return timestamp ?? normalized.toLowerCase();
    }

    const numericValue = this.parseNumberValue(normalized);

    if (numericValue !== null) {
      return numericValue;
    }

    return normalized.toLowerCase();
  }

  private parseNumberValue(value: string): number | null {
    const normalized = value
      .replace(/\s/g, '')
      .replace(/\$/g, '')
      .replace(/\./g, '')
      .replace(',', '.');

    if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
      return null;
    }

    const numericValue = Number(normalized);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  private parseDateValue(value: string): number | null {
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }

    const slashMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }

  private formatCellValue(value: string, column: DataTableColumn<T>): string {
    if (column.cellKind === 'fileTypeIcon') {
      return (value ?? '').trim() || '-';
    }

    let formattedValue = value ?? '';

    if (column.formatAsDate) {
      formattedValue = this.formatDateValue(formattedValue);
    }

    if (column.formatAsCurrency) {
      formattedValue = this.formatCurrencyCellValue(formattedValue);
    }

    if (column.formatAsSentence) {
      formattedValue = formatSentenceValue(formattedValue);
    }

    return formattedValue || '-';
  }

  private formatCurrencyCellValue(value: string): string {
    return formatCurrencyValue(value);
  }

  private formatDateValue(value: string): string {
    const normalized = value?.trim();
    if (!normalized || normalized === '-') {
      return '-';
    }

    const directDateMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
    if (directDateMatch) {
      return directDateMatch[1];
    }

    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toISOString().split('T')[0];
  }

  ngAfterViewInit(): void {
    if (!this.enableInfiniteScroll || !this.scrollContainer) {
      return;
    }

    const container = this.scrollContainer.nativeElement;

    this.scrollListener = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (!isNearBottom || this.isLoadingMore || this.isLoadMorePending || !this.hasMore) {
        return;
      }

      this.isLoadMorePending = true;
      this.currentBlockIndex++;

      this.loadMore.emit({
        blockIndex: this.currentBlockIndex,
        offset: this.rows.length,
      });
    };

    container.addEventListener('scroll', this.scrollListener);
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    if (this.scrollListener && this.scrollContainer) {
      this.scrollContainer.nativeElement.removeEventListener('scroll', this.scrollListener);
      this.scrollListener = null;
    }
  }

  resetScrollInfinite(): void {
    this.currentBlockIndex = 0;
    this.isLoadMorePending = false;
  }
}
