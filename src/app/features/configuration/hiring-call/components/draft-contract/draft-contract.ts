import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { HiringCallService } from '../../data/hiring-call.service';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { rxResource } from '@angular/core/rxjs-interop';
import { forNext } from '../../../../../core/utils/for-next.function';
import { ProfessorInformationItem } from '../../model/hiring-call.model';
import { AppIconName } from '../../../../../shared/ui/icon/icons';


interface HeaderChip {
  id: string;
  label: string;
  icon?: AppIconName;
}

@Component({
  selector: 'app-draft-contract',
  imports: [Modal, Icon],
  templateUrl: './draft-contract.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftContract {

  private readonly hiringCallService = inject(HiringCallService);

  readonly isOpen = input(false);
  readonly idCargaDocente = input<number | null>(null);
  readonly close = output<void>();

  readonly informationResource = rxResource({
    params: () => this.resolveInformationParams(),
    stream: ({ params }) =>
      this.hiringCallService.getProfessorInformation(params.idCargaDocente),
  });

  readonly information = computed(() => {
    if (!this.isOpen() || !this.informationResource.hasValue()) {
      return null;
    }
    return this.informationResource.value();
  });

  readonly isLoading = computed(
    () => this.isOpen() && this.informationResource.isLoading(),
  );

  readonly titleName = computed(() => {
    const name = this.information()?.nombreCompleto?.trim();
    return name || 'Plan de trabajo';
  });

  readonly titleDocument = computed(
    () => this.information()?.documentoIdentidad?.trim() || '',
  );

  readonly headerChips = computed(() =>
    this.buildHeaderChips(this.information()),
  );

  private buildHeaderChips(
    information: ProfessorInformationItem | null,
  ): HeaderChip[] {
    if (!information) {
      return [];
    }

    const chips: HeaderChip[] = [];
    const candidates: Array<HeaderChip | null> = [
      this.toChip('modalidad', null, information.modalidadContratacion),
      this.toChip('horas', 'Horas', information.horasTrabajo),
      this.toChip('categoria', 'Categoría', information.categoriaDocente),
      this.toChip(
        'categorizacion',
        'Categorización',
        information.estadoCategorizacion,
      ),
      this.toChip('puntos', 'Puntos', information.puntos),
      this.toChip(
        'asignacion',
        'Asignación salarial',
        this.displayCurrency(information.asignacionSalarial),
      ),
      this.toChip(
        'valor-hora',
        'Valor hora',
        this.displayCurrency(information.valorHora),
      ),
      this.toDateChip(information.fechaInicio, information.fechaFin),
      this.toChip('direccion', 'Dirección', information.direccionDomicilio),
      this.toChip('correo-personal', 'Personal', information.correoPersonal),
      this.toChip(
        'correo-institucional',
        'Institucional',
        information.correoInstitucional,
      ),
    ];

    forNext(candidates, (chip) => {
      if (chip) {
        chips.push(chip);
      }
    });

    return chips;
  }

  private resolveInformationParams(): { idCargaDocente: number } | undefined {
    if (!this.isOpen()) {
      return undefined;
    }

    const idCargaDocente = this.idCargaDocente();
    if (idCargaDocente == null) {
      return undefined;
    }

    return { idCargaDocente };
  }

  private toChip(
    id: string,
    prefix: string | null,
    value: string | number | null | undefined,
    icon?: AppIconName,
  ): HeaderChip | null {
    const text = this.displayText(value);
    if (text === '-') {
      return null;
    }

    return {
      id,
      label: prefix ? `${prefix} · ${text}` : text,
      icon,
    };
  }

  private toDateChip(
    fechaInicio: string | null | undefined,
    fechaFin: string | null | undefined,
  ): HeaderChip | null {
    const start = this.displayDate(fechaInicio);
    const end = this.displayDate(fechaFin);

    if (start === '-' && end === '-') {
      return null;
    }

    if (start === '-') {
      return { id: 'fechas', label: end, icon: 'calendar' };
    }

    if (end === '-') {
      return { id: 'fechas', label: start, icon: 'calendar' };
    }

    return {
      id: 'fechas',
      label: `${start} — ${end}`,
      icon: 'calendar',
    };
  }

  private displayCurrency(value: number | null | undefined): string | null {
    if (value == null || Number.isNaN(value)) {
      return null;
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  private displayText(value: string | number | null | undefined): string {
    if (value == null) {
      return '-';
    }

    const text = String(value).trim();
    return text || '-';
  }

  private displayDate(value: string | null | undefined): string {
    const text = value?.trim();
    if (!text) {
      return '-';
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (!match) {
      return text;
    }

    return `${match[3]}/${match[2]}/${match[1]}`;
  }
}
