/**
 * Aplicación: rvd
 * Archivo: load-restriction-page.ts
 * Ruta: src/app/features/administration/load-restriction/pages/load-restriction-page
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Fecha de creación: 22/07/2026
 * Modificaciones:
 * 22/07/2026 - Joel Daniel Arias Duarte - Creación inicial para la administración de restricción de carga.
 */
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { BreadcrumbTitle } from '../../../../../core/service/breadcrumb-title';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { LoadRestrictionForm } from '../../components/load-restriction-form/load-restriction-form';
import { LoadRestrictionTable } from '../../components/load-restriction-table/load-restriction-table';
import { LoadRestrictionService } from '../../data/load-restriction.service';
import {
  LoadRestrictionCatalogs,
  LoadRestrictionDetail,
  LoadRestrictionFormData,
  LoadRestrictionModalityItem,
} from '../../model/load-restriction.model';

@Component({
  selector: 'app-load-restriction-page',
  imports: [SectionFrame, LoadRestrictionTable, LoadRestrictionForm],
  templateUrl: './load-restriction-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadRestrictionPage implements OnInit {
  private readonly loadRestrictionService = inject(LoadRestrictionService);
  private readonly breadcrumbTitle = inject(BreadcrumbTitle);

  readonly modalities = signal<LoadRestrictionModalityItem[]>([]);
  readonly selectedModality = signal<LoadRestrictionModalityItem | null>(null);
  readonly selectedRestriction = signal<LoadRestrictionDetail | null>(null);
  readonly catalogs = signal<LoadRestrictionCatalogs | null>(null);

  readonly isLoading = signal(false);
  readonly isLoadingRestriction = signal(false);
  readonly isSaving = signal(false);

  async ngOnInit(): Promise<void> {
    this.breadcrumbTitle.setPageTitle('Restricción de carga');
    await this.refreshModalities();
    await this.loadCatalogs();
  }

  /**
   * Consulta las modalidades de contratación para la tabla principal.
   */
  async refreshModalities(): Promise<void> {
    this.isLoading.set(true);

    try {
      const rows = await firstValueFrom(
        this.loadRestrictionService.listModalities(),
      );

      this.modalities.set(rows ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Consulta los catálogos requeridos por el formulario.
   */
  async loadCatalogs(): Promise<void> {
    try {
      const catalogs = await firstValueFrom(
        this.loadRestrictionService.getCatalogs(),
      );

      this.catalogs.set(catalogs);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Selecciona la modalidad y consulta la restricción de carga actual.
   *
   * @param modality Modalidad seleccionada desde la tabla.
   */
  async openLoadRestriction(
    modality: LoadRestrictionModalityItem,
  ): Promise<void> {
    this.selectedModality.set(modality);
    this.selectedRestriction.set(null);
    this.isLoadingRestriction.set(true);

    try {
      const restriction = await firstValueFrom(
        this.loadRestrictionService.getRestriction(modality.id),
      );

      this.selectedRestriction.set(restriction);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoadingRestriction.set(false);
    }
  }

  /**
   * Cierra el formulario de restricción de carga y limpia la selección actual.
   */
  closeLoadRestriction(): void {
    this.selectedModality.set(null);
    this.selectedRestriction.set(null);
  }

  /**
   * Guarda la restricción de carga configurada para la modalidad seleccionada.
   * Al finalizar correctamente, cierra el formulario y retorna al listado principal.
   *
   * @param payload Datos enviados desde el formulario.
   */
  async onSaveRestriction(payload: LoadRestrictionFormData): Promise<void> {
    this.isSaving.set(true);

    try {
      await firstValueFrom(
        this.loadRestrictionService.saveRestriction(payload),
      );

      this.closeLoadRestriction();
      await this.refreshModalities();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }
}