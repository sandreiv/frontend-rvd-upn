import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
  model,
} from '@angular/core';

import { DataTable } from '../../../../../shared/ui/data-table/data-table';

import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableToolbarActionEvent,
} from '../../../../../shared/ui/data-table/table.types';

import { ProfileItem } from '../../model/profiles.model';

@Component({
  selector: 'app-profiles-table',
  standalone: true,
  imports: [DataTable],
  templateUrl: './profiles-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilesTable {

  profiles = input<ProfileItem[]>([]);

  selectedProfileIds = model<string[]>([]);

  @Output() refreshProfiles = new EventEmitter<void>();

  @Output() addProfile = new EventEmitter<void>();

  @Output() editProfile = new EventEmitter<ProfileItem>();

  @Output() relateStates = new EventEmitter<ProfileItem>();

  @Output() relatePersons = new EventEmitter<ProfileItem>();

  @Output() deleteProfile = new EventEmitter<ProfileItem>();

  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (
    row: ProfileItem,
  ): string => String(row.id);

  /**
   * Columnas visibles en la tabla.
   */
  readonly columns: DataTableColumn<ProfileItem>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      cell: (row) => row.nombre || '-',
      formatAsSentence: true,
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      cell: (row) => row.descripcion || '-',
      formatAsSentence: true,
    },
  ];

  /**
   * Acciones individuales.
   */
  readonly rowActions: DataTableRowAction<ProfileItem>[] = [
    {
        id: 'edit',
        label: 'Editar',
        icon: 'pencil',
    },
    {
        id: 'relateStates',
        label: 'Relacionar estados',
        icon: 'adjustmentsHorizontal',
    },
    {
        id: 'relatePersons',
        label: 'Relacionar personas',
        icon: 'userCircle',
    },
    {
        id: 'delete',
        label: 'Eliminar',
        icon: 'delete',
        className: 'text-red-500',
    },
   ];

  /**
   * Acciones de la barra de herramientas.
   */
  onToolbarAction(
    event: DataTableToolbarActionEvent<ProfileItem>,
  ): void {

    if (event.actionId === 'refresh') {

      this.refreshProfiles.emit();

      return;
    }

    if (event.actionId === 'add') {

      this.addProfile.emit();

      return;
    }

    if (event.actionId === 'deleteAll') {

      this.deleteAll.emit(
        event.selectedIds
          .map((id) => Number(id))
          .filter(
            (id) => Number.isFinite(id) && id > 0,
          ),
      );
    }
  }

  /**
   * Acciones del menú individual.
   */
  onRowAction(
    event: DataTableActionEvent<ProfileItem>,
    ): void {

    if (event.actionId === 'edit') {

        this.editProfile.emit(event.row);

        return;
    }

    if (event.actionId === 'relateStates') {

        this.relateStates.emit(event.row);

        return;
    }

    if (event.actionId === 'relatePersons') {

        this.relatePersons.emit(event.row);

        return;
    }

    if (event.actionId === 'delete') {

        this.deleteProfile.emit(event.row);
    }
   }

  /**
   * Actualizar los perfiles seleccionados.
   */
  onSelectedIdsChange(
    keys: Array<string | number>,
  ): void {

    this.selectedProfileIds.set(
      keys.map((key) => String(key)),
    );
  }

}