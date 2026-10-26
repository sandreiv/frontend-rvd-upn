import { AppIconName } from '../icon/icons';

export type DataTableColumnCellKind = 'text' | 'fileTypeIcon';

export type DataTableSortDirection = 'asc' | 'desc';

export type DataTableSortValue = string | number | Date | null | undefined;

export interface DataTableFileTypeIconClickEvent<T> {
  row: T;
  columnId: string;
  fileName: string;
  rowKey: string | number;
  rowIndex: number;
}

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => string;
  cellKind?: DataTableColumnCellKind;
  formatAsDate?: boolean;
  formatAsSentence?: boolean;
  formatAsCurrency?: boolean;
  allowHtml?: boolean;
  headerClassName?: string;
  cellClassName?: string;

  sortable?: boolean;
  sortValue?: (row: T) => DataTableSortValue;
}

export interface DataTableRowAction<T> {
  id: string;
  label: string;
  icon: AppIconName;
  className?: string;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  tooltip?: string | ((row: T) => string);
}

export interface DataTableInlineIcon<T> {
  id: string;
  icon: AppIconName;
  tooltip?: string;
  className?: string;
  visible?: (row: T) => boolean;
}

export interface DataTableActionEvent<T> {
  actionId: string;
  row: T;
  rowIndex: number;
  rowKey: string | number;
}

export type DataTableToolbarActionId = 'refresh' | 'deleteAll' | 'add';

export interface DataTableToolbarActionEvent<T> {
  actionId: DataTableToolbarActionId;
  rows: T[];
  selectedRows: T[];
  selectedRowKeys: Array<string | number>;
  selectedIds: string[];
  searchTerm: string;
}

export interface DataTableSearchEvent<T> {
  searchTerm: string;
  rows: T[];
}

export interface DataTableSelectionChangeEvent<T> {
  selectedRows: T[];
  selectedRowKeys: Array<string | number>;
  allVisibleSelected: boolean;
}
