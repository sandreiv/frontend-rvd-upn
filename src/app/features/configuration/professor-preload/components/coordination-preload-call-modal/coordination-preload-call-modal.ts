import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, map, switchMap } from 'rxjs';
import { Label } from '../../../../../shared/components/form/label/label';
import {
  Select,
  type Option,
} from '../../../../../shared/components/form/select/select';
import { Button } from '../../../../../shared/ui/button/button';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { CoordinationService } from '../../data/coordination.service';
import {
  CoordinationItem,
  CoordinationPreloadCallApi,
} from '../../model/coordination.model';

@Component({
  selector: 'app-coordination-preload-call-modal',
  imports: [Modal, Label, Select, Button],
  templateUrl: './coordination-preload-call-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinationPreloadCallModal {
  private readonly coordinationService = inject(CoordinationService);

  isOpen = input(false);
  coordination = input.required<CoordinationItem>();
  idPeriodoUniversidad = input<number | null>(null);

  close = output<void>();
  saved = output<CoordinationItem>();

  readonly selectedPreloadCallId = signal('');
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly resolvedPeriodId = computed(
    () =>
      this.idPeriodoUniversidad() ??
      this.coordination().idPeriodoUniversidad,
  );

  readonly activePreloadCallsResource = rxResource({
    params: () => {
      if (!this.isOpen()) {
        return undefined;
      }

      const idPeriodoUniversidad = this.resolvedPeriodId();
      if (idPeriodoUniversidad == null) {
        return undefined;
      }

      return { idPeriodoUniversidad };
    },
    stream: ({ params }) =>
      this.coordinationService.getAssignablePreloadCalls(
        params.idPeriodoUniversidad,
      ),
    defaultValue: [] as CoordinationPreloadCallApi[],
  });

  readonly preloadCallOptions = computed<Option[]>(() =>
    this.activePreloadCallsResource.value().map((item) => ({
      value: String(item.id),
      label: item.nombre,
    })),
  );

  readonly isLoadingOptions = computed(() =>
    this.activePreloadCallsResource.isLoading(),
  );

  readonly canSave = computed(
    () =>
      !!this.selectedPreloadCallId() &&
      this.resolvedPeriodId() != null &&
      !this.isSaving() &&
      !this.isLoadingOptions(),
  );

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.selectedPreloadCallId.set('');
        this.saveError.set(null);
        return;
      }

      this.selectedPreloadCallId.set(
        this.coordination().idConvocatoria != null
          ? String(this.coordination().idConvocatoria)
          : '',
      );
    });
  }

  onPreloadCallChange(preloadCallId: string): void {
    this.selectedPreloadCallId.set(preloadCallId);
    this.saveError.set(null);
  }

  onSave(): void {
    const idConvocatoria = Number(this.selectedPreloadCallId());
    const idPeriodoUniversidad = this.resolvedPeriodId();

    if (!idConvocatoria || idPeriodoUniversidad == null) {
      return;
    }

    const coordination = this.coordination();

    const request = {
      idCoordinacion: coordination.id,
      idConvocatoria,
    };

    const selectedPreloadCall = this.activePreloadCallsResource
      .value()
      .find((item) => item.id === idConvocatoria);

    this.isSaving.set(true);
    this.saveError.set(null);

    this.coordinationService
      .savePreload(request)
      .pipe(
        switchMap(() =>
          this.coordinationService.getCoordinations(
            idPeriodoUniversidad,
            idConvocatoria,
          ),
        ),
        map((items) => {
          const updated = items.find((item) => item.id === coordination.id);

          if (updated) {
            return updated;
          }

          return this.buildUpdatedCoordinationFromSelectedPreloadCall(
            coordination,
            selectedPreloadCall,
            idConvocatoria,
          );
        }),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: (updated) => this.saved.emit(updated),
        error: () =>
          this.saveError.set(
            'No fue posible asignar la convocatoria. Intente nuevamente.',
          ),
      });
  }

  private buildUpdatedCoordinationFromSelectedPreloadCall(
    coordination: CoordinationItem,
    preloadCall: CoordinationPreloadCallApi | undefined,
    idConvocatoria: number,
  ): CoordinationItem {
    const periodoUniversidad = preloadCall?.periodoUniversidad;
    const nivelEducativo = preloadCall?.nivelEducativo;

    return {
      ...coordination,
      idConvocatoria,
      convocatoriaNombre:
        preloadCall?.nombre?.trim() ||
        preloadCall?.descripcion?.trim() ||
        coordination.convocatoriaNombre,
      nivelEducativo:
        nivelEducativo?.descripcion?.trim() ||
        nivelEducativo?.nombre?.trim() ||
        coordination.nivelEducativo,
      periodoUniversidad: periodoUniversidad
        ? `${periodoUniversidad.anio}-${periodoUniversidad.periodo}`
        : coordination.periodoUniversidad,
      idPeriodoUniversidad:
        periodoUniversidad?.id ?? coordination.idPeriodoUniversidad,
      anioUniversidad:
        periodoUniversidad?.anio ?? coordination.anioUniversidad,
      idNivelEducativo:
        nivelEducativo?.id ?? coordination.idNivelEducativo,
      modalidadesContratacion:
        preloadCall?.modalidadesContratacion ??
        coordination.modalidadesContratacion,
    };
  }
}
