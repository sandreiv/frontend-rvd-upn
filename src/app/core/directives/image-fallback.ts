import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appImageFallback]',
})
export class ImageFallback {
  @Input() appImageFallback: string | undefined;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  /**
   * Este código define un decorador `@HostListener` que escucha el evento `error` en el elemento anfitrión o donde se eta pasando como atributo esta directiva.
   * Cuando ocurre un error al cargar la imagen, se llama al método `onError()`.
   * El método establece el atributo `src` del elemento anfitrión en una URL de imagen de respaldo especificada en la variable `appImageFallback`.
   * Si `appImageFallback` no está definido, el método establece el atributo `src` en una URL de imagen de respaldo predeterminada.
   * El `renderer` se utiliza para establecer el atributo del elemento anfitrión.
   * En general, este código proporciona una imagen de respaldo en caso de que la imagen original no se cargue correctamente.
   */
  @HostListener('error') onError() {
      const fallbackUrl = this.appImageFallback || '/images/fallback/image-fallback.png';
    this.renderer.setAttribute(this.el.nativeElement, 'src', fallbackUrl);
  }
}
