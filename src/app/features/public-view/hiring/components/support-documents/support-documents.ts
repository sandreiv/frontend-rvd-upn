import {
    ChangeDetectionStrategy,
    Component,
    computed,
    input,
    output,
} from '@angular/core';

import {
    CollapsibleSection,
} from '../../../../../shared/components/form/collapsible-section/collapsible-section';

import {
    Icon,
} from '../../../../../shared/ui/icon/icon';

import {
    PublicSupportDocumentCategory,
    PublicSupportDocumentFile,
    PublicSupportDocuments,
} from '../../model/hiring.model';


interface SupportDocumentRow {
    codigo: string;
    nombre: string;
    archivos: PublicSupportDocumentFile[];
    habilitada: boolean;
}

export interface SupportDocumentsUploadRequest {
    codigoCategoria: string;
    archivos: File[];
}

@Component({
    selector: 'app-public-support-documents',

    imports: [
        CollapsibleSection,
        Icon,
    ],

    templateUrl: './support-documents.html',

    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class SupportDocuments {

    readonly categories =
        input<PublicSupportDocumentCategory[]>(
            [],
        );

    readonly documents =
        input<PublicSupportDocuments | null>(
            null,
        );

    readonly loading =
        input(false);

    readonly error =
        input(false);

    readonly uploading =
        input(false);

    readonly deleting =
        input(false); 
    
    readonly readOnly =
        input(false);

    readonly uploadProgress =
        input<string | null>(null);

    readonly uploadRequested =
        output<SupportDocumentsUploadRequest>();
    
    readonly viewRequested =
    output<PublicSupportDocumentFile>();

    readonly downloadRequested =
    output<PublicSupportDocumentFile>();

    readonly deleteRequested =
    output<PublicSupportDocumentFile>();

    readonly downloadingFileId =
    input<string | null>(null);    

    readonly expanded =
        input(false);

    readonly expandedChange =
        output<boolean>();


    readonly rows = computed<
        SupportDocumentRow[]
    >(() => {

        const categorias =
            this.categories();

        const registradas =
            this.documents()?.categorias ?? [];

        /*
         * Indexamos las categorías que
         * tienen documentos registrados.
         */
        const documentosPorCategoria =
            new Map(
                registradas.map(
                    categoria => [
                        categoria.codigo,
                        categoria,
                    ],
                ),
            );


        const filasOficiales =
            categorias.map(
                categoria => {

                    const registrada =
                        documentosPorCategoria.get(
                            categoria.codigo,
                        );

                    return {
                        codigo:
                            categoria.codigo,

                        nombre:
                            categoria.nombre,

                        archivos:
                            registrada?.archivos ?? [],

                        habilitada: true,
                    };
                },
            );

        const codigosOficiales =
            new Set(
                categorias.map(
                    categoria =>
                        categoria.codigo,
                ),
            );

        const filasHistoricas =
            registradas
                .filter(
                    categoria =>
                        !codigosOficiales.has(
                            categoria.codigo,
                        ),
                )
                .map(
                    categoria => ({
                        codigo:
                            categoria.codigo,

                        nombre:
                            categoria.nombre,

                        archivos:
                            categoria.archivos ?? [],

                        habilitada: false,
                    }),
                );

        return [
            ...filasOficiales,
            ...filasHistoricas,
        ];
    });


    /*
     * Cantidad total de documentos
     * registrados en la contratación.
     */
    readonly totalFiles = computed(
        () =>
            this.rows().reduce(
                (total, categoria) =>
                    total +
                    categoria.archivos.length,
                0,
            ),
    );



    onExpandedChange(
        expanded: boolean,
    ): void {

        this.expandedChange.emit(
            expanded,
        );
    }


    onFilesSelected(
        event: Event,
        codigoCategoria: string,
    ): void {

        const input =
            event.target as HTMLInputElement;

        const archivos =
            Array.from(
                input.files ?? [],
            );

        input.value = '';

        if (
            archivos.length === 0 ||
            this.readOnly() ||
            this.uploading() ||
            this.deleting()
        ) {
            return;
        }

        const categoriaHabilitada =
            this.categories().some(
                categoria =>
                    categoria.codigo ===
                    codigoCategoria,
            );

        if (!categoriaHabilitada) {
            return;
        }

        this.uploadRequested.emit({
            codigoCategoria,
            archivos,
        });
    }


    /*
     * Convierte el tamaño del archivo
     * a una representación legible.
     */
    formatFileSize(
        bytes: number,
    ): string {

        if (
            !Number.isFinite(bytes) ||
            bytes < 0
        ) {
            return '—';
        }

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)
                } KB`;
        }

        return `${(
                bytes /
                (1024 * 1024)
            ).toFixed(1)
            } MB`;
    }

    canPreview(
    archivo: PublicSupportDocumentFile,
    ): boolean {

    const extension =
        (archivo.extension ?? '')
        .replace('.', '')
        .trim()
        .toLowerCase();

    return [
        'pdf',
        'jpg',
        'jpeg',
        'png',
    ].includes(extension);
    }

}