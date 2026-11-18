/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Fecha de creación: 18/11/2026
 * Modificaciones:
 * 18/11/2026 - Búsqueda de estudiantes con pensum, código y programa académico
 */
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { Button } from '../../../../../shared/ui/button/button';
import { Label } from '../../../../../shared/components/form/label/label';
import {
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../shared/components/form/typeahead-select/typeahead-select';
import { ProjectsService } from '../../data/projects.service';
import { ProjectStudentFormData, StudentSearchItem } from '../../model/projects.model';

const SEARCH_DEBOUNCE_TIME = 300;
const MIN_SEARCH_CHARS = 2;
const MAX_SEARCH_RESULTS = 25;

type ProjectStudentFormGroup = FormGroup<{
  idPersonaGeneral: FormControl<string>;
}>;

@Component({
  selector: 'app-project-student-form',
  imports: [
    ReactiveFormsModule,
    Label,
    Button,
    TypeaheadSelect,
  ],
  templateUrl: './project-student-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectStudentForm {
  private readonly projectsService = inject(ProjectsService);
  private readonly searchTerm$ = new Subject<string>();

  projectId = input<number>(0);
  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveStudent = new EventEmitter<ProjectStudentFormData>();

  readonly filteredStudents = signal<StudentSearchItem[]>([]);
  readonly selectedStudent = signal<StudentSearchItem | null>(null);

  readonly form: ProjectStudentFormGroup = new FormGroup({
    idPersonaGeneral: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    this.searchTerm$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_TIME),
        distinctUntilChanged(),
        switchMap((term: string) =>
          this.projectsService
            .searchStudents(term)
            .pipe(catchError(() => of([] as StudentSearchItem[]))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((rows: StudentSearchItem[]) =>
        this.filteredStudents.set(rows.slice(0, MAX_SEARCH_RESULTS)),
      );

    this.form.controls.idPersonaGeneral.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((val) => {
        if (!val) {
          this.selectedStudent.set(null);
          return;
        }
        const item = this.filteredStudents().find(
          (s) => String(s.idPersonaGeneral) === String(val),
        );
        this.selectedStudent.set(item || null);
      });
  }

  readonly studentOptionAdapter = (item: unknown): TypeaheadOption => {
    const student = item as StudentSearchItem;
    const details = [
      student.documento ? `Doc: ${student.documento}` : null,
      student.nombrePrograma ? `Prog: ${student.nombrePrograma}` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    return {
      value: String(student.idPersonaGeneral),
      label: student.nombreCompleto,
      secondaryLabel: details || 'Sin datos de pensum',
      data: student,
    };
  };

  onSearchStudent(term: string): void {
    const normalized = term.trim();
    if (normalized.length < MIN_SEARCH_CHARS) {
      this.filteredStudents.set([]);
      return;
    }
    this.searchTerm$.next(normalized);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();
    const student = this.selectedStudent();

    this.saveStudent.emit({
      idProyecto: this.projectId(),
      idPersonaGeneral: Number(raw.idPersonaGeneral),
      idEstudiantePensum: student?.idEstudiantePensum ?? null,
    });
  }
}
