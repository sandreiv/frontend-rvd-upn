import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import {
  DomSanitizer,
  SafeResourceUrl,
} from '@angular/platform-browser';
import { Button } from '../../../ui/button/button';
import { Modal } from '../../../ui/modal/modal';
import { DocumentRequest } from '../../../model/document.model';
import { WebRequestService } from '../../../../core/service/web-request-service';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-document-preview',
  standalone: true,
  imports: [CommonModule, Modal, Button],
  templateUrl: './document-preview.html',
  styleUrl: './document-preview.css',
})
export class DocumentPreview implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly webRequestService =
    inject(WebRequestService);

  isOpen = input(false);
  document =
    input<DocumentRequest | null>(null);
  autoLoad = input(true);
  isLoading = input(false);
  error = input<string | null>(null);
  fileName = input<string>('');
  previewUrl =
    input<SafeResourceUrl | null>(null);
  downloadDisabled = input(false);
  className = input('max-w-275 m-4');

  close = output<void>();
  download = output<void>();

  private previewObjectUrl:
    string | null = null;

  private readonly internalLoading =
    signal(false);

  private readonly internalError =
    signal<string | null>(null);

  private readonly internalPreviewUrl =
    signal<SafeResourceUrl | null>(null);

  constructor() {
    effect(() => {
      if (!this.autoLoad()) {
        return;
      }

      if (!this.isOpen()) {
        this.clearInternalState();
        return;
      }

      const doc = this.document();

      if (!doc) {
        this.internalError.set(
          'No hay documento para previsualizar.',
        );
        this.internalLoading.set(false);
        this.internalPreviewUrl.set(null);
        return;
      }

      void this.loadPreview(doc);
    });
  }

  onClose(): void {
    this.close.emit();
  }

  ngOnDestroy(): void {
    this.revokePreviewObjectUrl();
  }

  resolvedIsLoading(): boolean {
    return this.autoLoad()
      ? this.internalLoading()
      : this.isLoading();
  }

  resolvedError(): string | null {
    return this.autoLoad()
      ? this.internalError()
      : this.error();
  }

  resolvedPreviewUrl():
    SafeResourceUrl | null {

    return this.autoLoad()
      ? this.internalPreviewUrl()
      : this.previewUrl();
  }

  resolvedDownloadDisabled(): boolean {
    return this.autoLoad()
      ? this.internalLoading()
      : this.downloadDisabled();
  }

  resolvedFileName(): string {
    const explicitName =
      this.fileName()?.trim();

    if (
      explicitName &&
      explicitName !== 'Documento PDF'
    ) {
      return explicitName;
    }

    const doc = this.document();

    if (!doc) {
      return 'Documento PDF';
    }

    const byNombreArchivo =
      doc.nombreArchivo?.trim();

    if (byNombreArchivo) {
      return byNombreArchivo;
    }

    if (
      doc.archivo instanceof File &&
      doc.archivo.name?.trim()
    ) {
      return doc.archivo.name.trim();
    }

    const fromPath =
      this.extractFileNameFromPath(
        doc.path,
      );

    if (fromPath) {
      return fromPath;
    }

    return 'Documento PDF';
  }

  onDownload(): void {
    const preview =
      this.resolvedPreviewUrl();

    if (
      !preview ||
      this.resolvedIsLoading() ||
      this.resolvedDownloadDisabled()
    ) {
      return;
    }

    if (this.autoLoad()) {
      if (!this.previewObjectUrl) {
        return;
      }

      const anchor =
        document.createElement('a');

      anchor.href =
        this.previewObjectUrl;

      anchor.download =
        this.resolvedFileName();

      anchor.click();

      return;
    }

    this.download.emit();
  }

  private async loadPreview(
    doc: DocumentRequest,
  ): Promise<void> {

    this.internalLoading.set(true);
    this.internalError.set(null);
    this.internalPreviewUrl.set(null);

    this.revokePreviewObjectUrl();

    try {
      let sourceBlob: Blob | File;

      if (
        doc.archivo instanceof File &&
        doc.archivo.size > 0
        ) {

        sourceBlob = doc.archivo;

        } else if (doc.path?.trim()) {

        sourceBlob =
            await firstValueFrom(
            this.webRequestService.getBlob(
                '/files',
                {
                path: doc.path,
                },
            ),
            );

        } else {

        this.internalError.set(
            'No fue posible ubicar el archivo para previsualizar.',
        );

        return;
      }

      const previewBlob =
        this.normalizePreviewBlob(
          doc,
          sourceBlob,
        );

      this.previewObjectUrl =
        URL.createObjectURL(
          previewBlob,
        );

      this.internalPreviewUrl.set(
        this.sanitizer
          .bypassSecurityTrustResourceUrl(
            this.previewObjectUrl,
          ),
      );

    } catch (error) {

      console.error(
        'Error abriendo previsualización del documento:',
        error,
      );

      this.internalError.set(
        'No fue posible cargar la previsualización del documento.',
      );

    } finally {
      this.internalLoading.set(false);
    }
  }

  private normalizePreviewBlob(
    doc: DocumentRequest,
    blob: Blob,
  ): Blob {

    const extension =
      (doc.extension ?? '')
        .replace('.', '')
        .trim()
        .toLowerCase();

    const mimeType =
      (blob.type || '')
        .toLowerCase();

    if (
      extension === 'pdf' &&
      mimeType !== 'application/pdf'
    ) {
      return new Blob(
        [blob],
        {
          type: 'application/pdf',
        },
      );
    }

    if (
      (
        extension === 'jpg' ||
        extension === 'jpeg'
      ) &&
      mimeType !== 'image/jpeg'
    ) {
      return new Blob(
        [blob],
        {
          type: 'image/jpeg',
        },
      );
    }

    if (
      extension === 'png' &&
      mimeType !== 'image/png'
    ) {
      return new Blob(
        [blob],
        {
          type: 'image/png',
        },
      );
    }

    return blob;
  }

  private extractFileNameFromPath(
    path?: string,
  ): string | null {

    const normalizedPath =
      (path ?? '').trim();

    if (!normalizedPath) {
      return null;
    }

    const segments =
      normalizedPath.split('/');

    const lastSegment =
      segments[
        segments.length - 1
      ]?.trim();

    return lastSegment || null;
  }

  private clearInternalState():
    void {

    this.internalLoading.set(false);
    this.internalError.set(null);
    this.internalPreviewUrl.set(null);

    this.revokePreviewObjectUrl();

  }

  private revokePreviewObjectUrl():
    void {

    if (this.previewObjectUrl) {
      URL.revokeObjectURL(
        this.previewObjectUrl,
      );

      this.previewObjectUrl = null;
    }
  }
}