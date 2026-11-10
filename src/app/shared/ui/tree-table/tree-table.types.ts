import { AppIconName } from '../icon/icons';

export interface TreeTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => string;
  formatAsSentence?: boolean;
  allowHtml?: boolean;
  headerClassName?: string;
  cellClassName?: string;
}

export interface TreeTableRowAction<T> {
  id: string;
  label: string;
  icon?: AppIconName;
  className?: string;
  visible?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
  tooltip?: string | ((row: T) => string);
}

export interface TreeTableNode<T> {
  data: T;
  id: string | number;
  parentId: string | number | null;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  childrenCount: number;
}

export interface TreeTableActionEvent<T> {
  actionId: string;
  row: T;
  node: TreeTableNode<T>;
}

export type TreeTableToolbarActionId = 'refresh' | 'deleteAll' | 'add';

export interface TreeTableToolbarActionEvent<T> {
  actionId: TreeTableToolbarActionId;
  rows: T[];
  selectedRows: T[];
  selectedRowKeys: Array<string | number>;
  selectedIds: string[];
  searchTerm: string;
}
