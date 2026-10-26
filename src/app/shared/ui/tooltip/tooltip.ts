import {
  ConnectedPosition,
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  inject,
  input,
} from '@angular/core';
import { TooltipContent } from './tooltip-content';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

const TOOLTIP_OFFSET = 8;

const POSITIONS: Record<TooltipPlacement, ConnectedPosition> = {
  top: {
    originX: 'center',
    originY: 'top',
    overlayX: 'center',
    overlayY: 'bottom',
    offsetY: -TOOLTIP_OFFSET,
  },
  bottom: {
    originX: 'center',
    originY: 'bottom',
    overlayX: 'center',
    overlayY: 'top',
    offsetY: TOOLTIP_OFFSET,
  },
  left: {
    originX: 'start',
    originY: 'center',
    overlayX: 'end',
    overlayY: 'center',
    offsetX: -TOOLTIP_OFFSET,
  },
  right: {
    originX: 'end',
    originY: 'center',
    overlayX: 'start',
    overlayY: 'center',
    offsetX: TOOLTIP_OFFSET,
  },
};

/**
 * Muestra un tooltip flotante con estilos del proyecto al pasar el
 * cursor o enfocar el elemento anfitrión. Basado en CDK Overlay.
 */
@Directive({
  selector: '[appTooltip]',
})
export class Tooltip implements OnDestroy {
  private readonly overlay = inject(Overlay);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly text = input('', { alias: 'appTooltip' });
  readonly placement = input<TooltipPlacement>('right', {
    alias: 'tooltipPlacement',
  });

  private overlayRef?: OverlayRef;

  @HostListener('mouseenter')
  @HostListener('focus')
  show(): void {
    if (!this.text() || this.overlayRef) {
      return;
    }

    const overlayRef = this.createOverlay();
    const ref = overlayRef.attach(new ComponentPortal(TooltipContent));
    ref.setInput('text', this.text());
    this.overlayRef = overlayRef;
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  hide(): void {
    this.overlayRef?.dispose();
    this.overlayRef = undefined;
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private createOverlay(): OverlayRef {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.host)
      .withPositions(this.buildPositions());

    return this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: 'app-tooltip-panel',
    });
  }

  private buildPositions(): ConnectedPosition[] {
    const primary = POSITIONS[this.placement()];
    const fallback = POSITIONS[this.opposite(this.placement())];
    return [primary, fallback];
  }

  private opposite(placement: TooltipPlacement): TooltipPlacement {
    const map: Record<TooltipPlacement, TooltipPlacement> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };
    return map[placement];
  }
}
