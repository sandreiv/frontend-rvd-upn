import { ChangeDetectionStrategy, Component, EventEmitter, input, model, Output } from "@angular/core";
import { DocumentTypesItem } from "../../model/document-types.model";
import { DataTableActionEvent, DataTableColumn, DataTableRowAction, DataTableToolbarActionEvent } from "../../../../../shared/ui/data-table/table.types";
import { DataTable } from "../../../../../shared/ui/data-table/data-table";

@Component({
  selector: 'app-document-types-table',
  imports: [DataTable],
  templateUrl: './document-types-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentTypesTable {

  items = input<DocumentTypesItem[]>([]);
  selectedIds = model<string[]>([]);

  @Output()
  refreshItems = new EventEmitter<void>();
  @Output()
  addItem = new EventEmitter<void>();
  @Output()
  editItem = new EventEmitter<DocumentTypesItem>();
  @Output()
  deleteItem = new EventEmitter<DocumentTypesItem>();
  @Output()
  deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: DocumentTypesItem): string => String(row.id);

  readonly columns: DataTableColumn<DocumentTypesItem>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      cell: (row) => row.nombre || '-',
      formatAsSentence: true
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      cell: (row) => row.descripcion || '-',
      formatAsSentence: true
    },
    {
      id: 'esObligatorio',
      header: 'Es obligatorio',
      cell: (row) => this.formatYesNo(row.esObligatorio)
    }
  ]

  readonly rowActions: DataTableRowAction<DocumentTypesItem>[] = [
    {
      id: 'edit',
      label: 'Editar',
      icon: 'pencil'
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      className: 'text-red-500'
    }
  ]

  onToolbarAction(event: DataTableToolbarActionEvent<DocumentTypesItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshItems.emit();
      return;
    }
    if (event.actionId === 'add') {
      this.addItem.emit();
      return;
    }
    if (event.actionId === 'deleteAll') {
      this.deleteAll.emit(
        event.selectedIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id))
      );
    }
  }

  onRowAction(event: DataTableActionEvent<DocumentTypesItem>): void {
    if (event.actionId === 'edit') {
      this.editItem.emit(event.row);
      return;
    }
    if (event.actionId === 'delete') {
      this.deleteItem.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string|number>): void {
    this.selectedIds.set(
      keys.map((key) => String(key))
    )
  }


  private formatYesNo(value: string|null): string {
    const normalized = String(value ?? '').trim().toUpperCase();

    return normalized === '1' || normalized === 'S' || normalized === 'SI' || normalized === 'TRUE'
      ? 'Sí'
      : 'No'
  }
}