import {
  afterNextRender,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  Renderer2,
  signal,
  SimpleChanges,
  ViewChild,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown',
  imports: [CommonModule],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.css',
})
export class Dropdown implements AfterViewInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Input() className = 'w-40 p-2';
  @Input() showArrow = false;
  @Input() arrowClassName = 'right-6';
  @Input() anchor: HTMLElement | null = null;
  @Input() gap = 4;

  @ViewChild('dropdownRef')
  set dropdownPanel(ref: ElementRef<HTMLDivElement> | undefined) {
    this.dropdownRef = ref;

    if (ref && this.isOpen) {
      this.queueReposition();
    }
  }

  readonly top = signal(0);
  readonly left = signal(0);
  readonly isPositioned = signal(false);
  readonly placement = signal<'top' | 'bottom'>('bottom');

  private dropdownRef?: ElementRef<HTMLDivElement>;
  private isAttachedToBody = false;
  private repositionAttempts = 0;
  private readonly maxRepositionAttempts = 10;
  private readonly injector = inject(Injector);
  private readonly renderer = inject(Renderer2);

  private handleClickOutside = (event: MouseEvent) => {
    if (
      !this.isOpen ||
      !this.dropdownRef?.nativeElement ||
      this.dropdownRef.nativeElement.contains(event.target as Node) ||
      (event.target as HTMLElement).closest('.dropdown-toggle')
    ) {
      return;
    }

    this.close.emit();
  };

  private handleViewportChange = () => {
    if (this.isOpen) {
      this.queueReposition();
    }
  };

  ngAfterViewInit(): void {
    document.addEventListener('mousedown', this.handleClickOutside);
    window.addEventListener('resize', this.handleViewportChange);
    document.addEventListener('scroll', this.handleViewportChange, true);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.isPositioned.set(false);
        this.repositionAttempts = 0;
        this.queueReposition();
        return;
      }

      this.isPositioned.set(false);
      this.repositionAttempts = 0;
      this.detachFromBody();
    }

    if (changes['anchor'] && this.isOpen) {
      this.queueReposition();
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousedown', this.handleClickOutside);
    window.removeEventListener('resize', this.handleViewportChange);
    document.removeEventListener('scroll', this.handleViewportChange, true);
    this.detachFromBody();
  }

  private queueReposition(): void {
    afterNextRender(() => this.repositionPanel(), { injector: this.injector });
  }

  private repositionPanel(): void {
    if (!this.isOpen) {
      return;
    }

    this.attachToBody();

    const anchorEl = this.resolveAnchor();
    const panelEl = this.dropdownRef?.nativeElement;

    if (!anchorEl || !panelEl) {
      if (this.repositionAttempts >= this.maxRepositionAttempts) {
        return;
      }

      this.repositionAttempts += 1;
      afterNextRender(() => this.repositionPanel(), { injector: this.injector });
      return;
    }

    this.repositionAttempts = 0;

    const triggerRect = anchorEl.getBoundingClientRect();
    const menuRect = panelEl.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = Math.max(0, this.gap);

    let top = triggerRect.bottom + gap;
    let placement: 'top' | 'bottom' = 'bottom';

    if (top + menuRect.height > viewportHeight - gap) {
      top = Math.max(triggerRect.top - menuRect.height - gap, gap);
      placement = 'top';
    }

    const preferredLeft = triggerRect.right - menuRect.width;
    const maxLeft = Math.max(gap, viewportWidth - menuRect.width - gap);
    const left = Math.min(Math.max(preferredLeft, gap), maxLeft);

    this.top.set(top);
    this.left.set(left);
    this.placement.set(placement);
    this.isPositioned.set(true);
  }

  private attachToBody(): void {
    const panelEl = this.dropdownRef?.nativeElement;

    if (!panelEl || panelEl.parentElement === document.body) {
      return;
    }

    this.renderer.appendChild(document.body, panelEl);
    this.isAttachedToBody = true;
  }

  private detachFromBody(): void {
    const panelEl = this.dropdownRef?.nativeElement;

    if (
      !panelEl ||
      !this.isAttachedToBody ||
      panelEl.parentElement !== document.body
    ) {
      return;
    }

    this.renderer.removeChild(document.body, panelEl);
    this.isAttachedToBody = false;
  }

  private resolveAnchor(): HTMLElement | null {
    if (!this.anchor) {
      return null;
    }

    if (this.anchor instanceof HTMLElement) {
      return this.anchor;
    }

    const ref = this.anchor as ElementRef<HTMLElement>;
    return ref.nativeElement ?? null;
  }
}
