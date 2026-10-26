import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import type { EChartsCoreOption, EChartsType } from 'echarts/core';
import { init, use } from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import { ThemeService } from '../../../../../core/service/theme-service';
import { forNext } from '../../../../../core/utils/for-next.function';
import { CoordinationService } from '../../data/coordination.service';
import {
  ActivitiesHours,
  ActivitiesHoursItem,
  CoordinationItem,
} from '../../model/coordination.model';

use([PieChart, TooltipComponent, CanvasRenderer, LabelLayout]);

const EMPTY_HOURS: ActivitiesHours = {
  totalHorasPreasignacion: [],
  totalHoras: 0,
};

const PIE_COLORS = [
  '#7EB6D4',
  '#4B5563',
  '#86C98A',
  '#F0A14A',
  '#9B7EBD',
  '#007B3E',
  '#5B9A8B',
  '#C4785A',
];

interface ActivitySlice {
  name: string;
  value: number;
  percent: number;
  itemStyle: { color: string };
}

@Component({
  selector: 'app-total-activities-graph',
  imports: [],
  templateUrl: './total-activities-graph.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TotalActivitiesGraph {
  private readonly coordinationService = inject(CoordinationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(ThemeService);

  coordination = input.required<CoordinationItem>();
  refreshKey = input(0);

  private readonly chartHost =
    viewChild<ElementRef<HTMLDivElement>>('chartHost');

  private chart: EChartsType | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private readonly theme = toSignal(this.themeService.theme$, {
    initialValue: 'light',
  });

  private readonly hoursResource = rxResource({
    params: () => {
      const idCarga = this.coordination().idCarga;
      const refreshKey = this.refreshKey();

      if (idCarga == null) {
        return undefined;
      }

      return { idCarga, refreshKey };
    },
    stream: ({ params }) =>
      this.coordinationService.getActivitiesHours(params.idCarga),
    defaultValue: EMPTY_HOURS,
  });

  readonly isLoading = computed(() => this.hoursResource.isLoading());

  readonly hasCarga = computed(() => this.coordination().idCarga != null);

  readonly titleUnidad = computed(() => {
    const unidad = this.displayValue(this.coordination().unidadRegional);
    return `Preasignación ${unidad}`;
  });

  readonly titleFacultad = computed(() =>
    this.displayValue(this.coordination().unidadArea),
  );

  readonly titleCoordinacion = computed(() =>
    this.displayValue(
      this.coordination().descripcion || this.coordination().nombre,
    ),
  );

  readonly slices = computed(() => {
    const data = this.hoursResource.value() ?? EMPTY_HOURS;
    return toActivitySlices(data.totalHorasPreasignacion, data.totalHoras);
  });

  readonly hasSlices = computed(() => this.slices().length > 0);

  constructor() {
    this.destroyRef.onDestroy(() => this.disposeChart());

    effect(() => {
      const host = this.chartHost();
      const slices = this.slices();
      const isDark = this.theme() === 'dark';

      if (!host || slices.length === 0) {
        untracked(() => this.disposeChart());
        return;
      }

      untracked(() => this.renderChart(host.nativeElement, slices, isDark));
    });
  }

  private displayValue(value: string | null | undefined): string {
    const normalized = value?.trim();
    return normalized ? normalized : '-';
  }

  private renderChart(
    host: HTMLElement,
    slices: ActivitySlice[],
    isDark: boolean,
  ): void {
    if (!this.chart || this.chart.getDom() !== host) {
      this.disposeChart();
      this.chart = init(host);
      this.observeResize(host);
    }

    this.chart.setOption(buildPieOption(slices, isDark), true);
  }

  private observeResize(host: HTMLElement): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => this.chart?.resize());
    this.resizeObserver.observe(host);
  }

  private disposeChart(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.chart?.dispose();
    this.chart = null;
  }
}

function toActivitySlices(
  items: ActivitiesHoursItem[],
  totalHoras: number,
): ActivitySlice[] {
  const slices: ActivitySlice[] = [];

  forNext(items, (item) => {
    if (item.horas <= 0) {
      return;
    }

    slices.push({
      name: resolveSliceName(item),
      value: item.horas,
      percent: totalHoras > 0 ? (item.horas / totalHoras) * 100 : 0,
      itemStyle: { color: PIE_COLORS[0] },
    });
  });

  slices.sort((left, right) => right.value - left.value);

  forNext(slices, (slice, index) => {
    slice.itemStyle = {
      color: PIE_COLORS[index % PIE_COLORS.length],
    };
  });

  return slices;
}

function resolveSliceName(item: ActivitiesHoursItem): string {
  const nombre = item.nombre?.trim();
  if (nombre) {
    return nombre.toUpperCase();
  }

  const codigo = item.codigo?.trim();
  return codigo ? codigo.toUpperCase() : 'SIN NOMBRE';
}

function buildPieOption(
  slices: ActivitySlice[],
  isDark: boolean,
): EChartsCoreOption {
  const labelColor = isDark ? '#e5e7eb' : '#374151';
  const borderColor = isDark ? '#1f2937' : '#ffffff';

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: formatTooltip,
    },
    series: [
      {
        type: 'pie',
        radius: '48%',
        center: ['50%', '52%'],
        avoidLabelOverlap: true,
        data: slices,
        label: {
          formatter: formatSliceLabel,
          color: labelColor,
          fontFamily: 'Outfit, sans-serif',
          fontSize: 11,
          lineHeight: 16,
          width: 180,
          overflow: 'break',
        },
        labelLine: {
          show: true,
          length: 18,
          length2: 22,
          smooth: 0.2,
        },
        itemStyle: {
          borderColor,
          borderWidth: 2,
        },
        emphasis: {
          scaleSize: 8,
        },
      },
    ],
  };
}

function formatSliceLabel(params: { name: string; data: unknown }): string {
  const slice = params.data as ActivitySlice | undefined;
  const percent = slice?.percent ?? 0;
  return `${params.name}: ${percent.toFixed(1)} %`;
}

function formatTooltip(params: { name: string; data: unknown }): string {
  const slice = params.data as ActivitySlice | undefined;
  const hours = slice?.value ?? 0;
  const percent = slice?.percent ?? 0;
  return `${params.name}<br/>${hours}h (${percent.toFixed(1)} %)`;
}
