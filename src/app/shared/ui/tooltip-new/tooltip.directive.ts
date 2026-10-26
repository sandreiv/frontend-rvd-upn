import {
  ApplicationRef,
  ComponentRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  OnDestroy,
  TemplateRef,
  createComponent,
  inject,
  input,
} from '@angular/core';
import { TooltipContent, TooltipPlacement, TooltipTheme } from './tooltip.types';
import { TooltipFloatingComponent } from './tooltip-floating.component';
import { AppIconName } from '../icon/icons';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  readonly content = input<TooltipContent>('', { alias: 'appTooltip' });
  readonly placement = input<TooltipPlacement>('top', { alias: 'tooltipPlacement' });
  readonly theme = input<TooltipTheme>('dark', { alias: 'tooltipTheme' });
  readonly icon = input<AppIconName | undefined>(undefined, { alias: 'tooltipIcon' });
  readonly kbd = input<string | undefined>(undefined, { alias: 'tooltipKbd' });
  readonly kbdIcon = input<AppIconName | undefined>(undefined, { alias: 'tooltipKbdIcon' });
  readonly offset = input<number>(8, { alias: 'tooltipOffset' });
  readonly disabled = input<boolean>(false, { alias: 'tooltipDisabled' });
  readonly delay = input<number>(80, { alias: 'tooltipDelay' });

  private componentRef: ComponentRef<TooltipFloatingComponent> | null = null;
  private wrapperElement: HTMLElement | null = null;
  private showTimeout: ReturnType<typeof setTimeout> | null = null;

  @HostListener('mouseenter')
  @HostListener('focus')
  onMouseEnter(): void {
    if (this.disabled() || !this.hasContent()) {
      return;
    }
    this.clearTimer();
    this.showTimeout = setTimeout(() => this.showTooltip(), this.delay());
  }

  @HostListener('click')
  onClick(): void {
    this.clearTimer();
    this.hideTooltip(true);
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  onMouseLeave(): void {
    this.clearTimer();
    this.hideTooltip();
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowChange(): void {
    if (this.wrapperElement) {
      this.updatePosition();
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.hideTooltip(true);
  }

  private hasContent(): boolean {
    const c = this.content();
    if (c instanceof TemplateRef) return true;
    return typeof c === 'string' && c.trim().length > 0;
  }

  private clearTimer(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }

  private showTooltip(): void {
    if (this.componentRef || !this.hasContent()) {
      return;
    }

    // 1. Create Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'fixed z-[2147483647] pointer-events-none transition-opacity duration-150 ease-out opacity-0';
    wrapper.style.zIndex = '2147483647';
    wrapper.style.top = '0px';
    wrapper.style.left = '0px';
    document.body.appendChild(wrapper);
    this.wrapperElement = wrapper;

    // 2. Instantiate Floating Component
    this.componentRef = createComponent(TooltipFloatingComponent, {
      environmentInjector: this.injector,
      hostElement: wrapper,
    });

    const c = this.content();
    if (c instanceof TemplateRef) {
      this.componentRef.setInput('template', c);
    } else if (typeof c === 'string') {
      this.componentRef.setInput('text', c);
    }

    this.componentRef.setInput('icon', this.icon());
    this.componentRef.setInput('kbd', this.kbd());
    this.componentRef.setInput('kbdIcon', this.kbdIcon());
    this.componentRef.setInput('theme', this.theme());
    this.componentRef.setInput('placement', this.placement());

    this.appRef.attachView(this.componentRef.hostView);
    this.componentRef.changeDetectorRef.detectChanges();

    this.updatePosition();

    // 3. Trigger Enter Animation
    requestAnimationFrame(() => {
      if (this.wrapperElement) {
        this.updatePosition();
        this.wrapperElement.classList.remove('opacity-0');
        this.wrapperElement.classList.add('opacity-100');
      }
    });
  }

  private hideTooltip(immediate = false): void {
    if (!this.wrapperElement && !this.componentRef) {
      return;
    }

    const wrapper = this.wrapperElement;
    const compRef = this.componentRef;
    this.wrapperElement = null;
    this.componentRef = null;

    if (wrapper) {
      wrapper.classList.remove('opacity-100');
      wrapper.classList.add('opacity-0');
    }

    const destroy = () => {
      if (compRef) {
        this.appRef.detachView(compRef.hostView);
        compRef.destroy();
      }
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    };

    if (immediate) {
      destroy();
    } else {
      setTimeout(destroy, 150);
    }
  }

  private updatePosition(): void {
    if (!this.wrapperElement) return;

    const hostRect = this.hostRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.wrapperElement.getBoundingClientRect();
    const offset = this.offset();
    let actualPlacement = this.placement();

    const spaceTop = hostRect.top;
    const spaceBottom = window.innerHeight - hostRect.bottom;
    const spaceLeft = hostRect.left;
    const spaceRight = window.innerWidth - hostRect.right;

    // Auto flip
    if (actualPlacement === 'top' && spaceTop < tooltipRect.height + offset && spaceBottom > spaceTop) {
      actualPlacement = 'bottom';
    } else if (actualPlacement === 'bottom' && spaceBottom < tooltipRect.height + offset && spaceTop > spaceBottom) {
      actualPlacement = 'top';
    } else if (actualPlacement === 'left' && spaceLeft < tooltipRect.width + offset && spaceRight > spaceLeft) {
      actualPlacement = 'right';
    } else if (actualPlacement === 'right' && spaceRight < tooltipRect.width + offset && spaceLeft > spaceRight) {
      actualPlacement = 'left';
    }

    let top = 0;
    let left = 0;

    switch (actualPlacement) {
      case 'top':
        top = hostRect.top - tooltipRect.height - offset;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + offset;
        left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + offset;
        break;
    }

    const padding = 8;
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding));
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding));

    this.wrapperElement.style.top = `${Math.round(top)}px`;
    this.wrapperElement.style.left = `${Math.round(left)}px`;
  }
}
