import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
    FormBuilder,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';

import { DatePicker } from '../../../../../shared/components/form/date-picker/date-picker';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import {
    Select,
    type Option as SelectOption,
} from '../../../../../shared/components/form/select/select';
import {
    TypeaheadSelect,
    type TypeaheadOption,
} from '../../../../../shared/components/form/typeahead-select/typeahead-select';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';

import {
    PublicAcademicLevel,
    PublicAcademicTitle,
    PublicAcademicTrainingSave,
    PublicCountry,
    PublicAcademicTraining,
} from '../../model/hiring.model';

@Component({
    selector: 'app-public-academic-training',
    imports: [
        ReactiveFormsModule,
        Label,
        InputField,
        Select,
        TypeaheadSelect,
        DatePicker,
        Button,
        Icon,
        NgTemplateOutlet,
    ],
    templateUrl: './academic-training.html',
    changeDetection:
        ChangeDetectionStrategy.OnPush,
})
export class AcademicTraining {
    private readonly fb = inject(FormBuilder);

    readonly academicLevels =
        input<PublicAcademicLevel[]>([]);

    readonly academicTitles =
        input<PublicAcademicTitle[]>([]);

    readonly countries =
        input<PublicCountry[]>([]);

    readonly titlesLoading =
        input(false);

    readonly saving =
        input(false);

    readonly readOnly=
        input(false);    

    readonly academicLevelChange =
        output<number>();

    readonly titleQueryChange =
        output<string>();

    readonly saveTraining =
        output<PublicAcademicTrainingSave>();

    readonly latestTraining =
        input<PublicAcademicTraining | null>(
            null,
        );

    readonly loadingLatest =
        input(false);

    readonly latestLoadError =
        input(false);

    readonly creating =
        signal(false);

    readonly academicLevelOptions =
        computed<SelectOption[]>(() =>
            this.academicLevels().map(
                (item) => ({
                    value: String(item.id),
                    label: item.descripcion,
                }),
            ),
        );

    readonly countryOptions =
        computed<SelectOption[]>(() =>
            this.countries().map(
                (item) => ({
                    value: item.id,
                    label: item.nombre,
                }),
            ),
        );

    readonly titleOptions =
        computed<TypeaheadOption[]>(() =>
            this.academicTitles().map(
                (item) => ({
                    value: String(item.id),
                    label: item.nombre,
                    data: item,
                }),
            ),
        );

    readonly form =
        this.fb.nonNullable.group({
            idNivelAcademico: [
                '',
                Validators.required,
            ],

            idTitulo: [
                '',
                Validators.required,
            ],

            institucion: [
                '',
                [
                    Validators.required,
                    Validators.maxLength(160),
                ],
            ],

            fechaGrado: [
                '',
                Validators.required,
            ],

            idPais: [
                '',
                Validators.required,
            ],
        });

    onAcademicLevelChange(
        value: string,
    ): void {
        this.form.controls.idTitulo.setValue('');

        const id = Number(value);

        if (!Number.isFinite(id)) {
            return;
        }

        this.academicLevelChange.emit(id);
    }

    onTitleQueryChange(
        query: string,
    ): void {
        this.titleQueryChange.emit(
            query.trim(),
        );
    }

    onSubmit(): void {

        if (this.readOnly()) {
            return;
        }

        if (
            this.form.invalid ||
            this.saving()
        ) {
            this.form.markAllAsTouched();
            return;
        }

        const value =
            this.form.getRawValue();

        this.saveTraining.emit({
            idNivelAcademico:
                Number(value.idNivelAcademico),

            idTitulo:
                Number(value.idTitulo),

            institucion:
                value.institucion.trim(),

            fechaGrado:
                value.fechaGrado,

            idPais:
                value.idPais,
        });
    }

    startNewTraining(): void {

        if (this.readOnly()) {
            return;
        }

        this.resetForm();
        this.creating.set(true);
    }

    cancelNewTraining(): void {
        this.resetForm();
        this.creating.set(false);
    }

    showLatestTraining(): void {
        this.resetForm();
        this.creating.set(false);
    }

    resetView(): void {
        this.resetForm();
        this.creating.set(false);
    }

    resetForm(): void {
        this.form.reset({
            idNivelAcademico: '',
            idTitulo: '',
            institucion: '',
            fechaGrado: '',
            idPais: '',
        });
    }

    formatDate(
        value: string | null,
    ): string {
        if (!value) {
            return '—';
        }

        const parts = value.split('-');

        if (parts.length !== 3) {
            return value;
        }

        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
}