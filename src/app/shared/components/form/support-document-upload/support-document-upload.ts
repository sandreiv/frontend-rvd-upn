import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Button } from '../../../ui/button/button';

@Component({
  selector: 'app-support-document-upload',
  imports: [Button],
  templateUrl: './support-document-upload.html',
  styleUrl: './support-document-upload.css',
})
export class SupportDocumentUpload {
  @Input() title = 'Documento soporte';
  @Input() uploadLabel = 'Carga tu documento';
  @Input() helperText = 'Selecciona un archivo.';
  @Input() accept = '*/*';
  @Input() selectButtonText = 'Seleccionar archivo';
  @Input() changeButtonText = 'Cambiar archivo';
  @Input() clearButtonText = 'Limpiar';
  @Input() selectedFileName = '';
  @Input() fileError: string | null = null;
  @Input() disabled = false;

  @Output() fileSelected = new EventEmitter<File | null>();
  @Output() clearRequested = new EventEmitter<void>();

  @ViewChild('documentInput') private documentInput?: ElementRef<HTMLInputElement>;

  triggerFilePicker(): void {
    if (this.disabled || !this.documentInput?.nativeElement) {
      return;
    }

    // Permite re-seleccionar el mismo archivo y dispara (change).
    this.documentInput.nativeElement.value = '';
    this.documentInput.nativeElement.click();
  }

  handleFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    this.fileSelected.emit(file);
  }

  resetFileSelection(): void {
    if (this.disabled) {
      return;
    }

    if (this.documentInput?.nativeElement) {
      this.documentInput.nativeElement.value = '';
    }

    this.clearRequested.emit();
  }
}


