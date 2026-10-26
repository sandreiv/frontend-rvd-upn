import { ElementRef, Renderer2 } from '@angular/core';
import { vi } from 'vitest';
import { ImageFallback } from './image-fallback';

describe('ImageFallback', () => {
  it('should create an instance', () => {
    const elementRef = { nativeElement: document.createElement('img') } as ElementRef<HTMLImageElement>;
    const renderer = {
      setAttribute: vi.fn(),
    } as unknown as Renderer2;

    const directive = new ImageFallback(elementRef, renderer);
    expect(directive).toBeTruthy();
  });
});
