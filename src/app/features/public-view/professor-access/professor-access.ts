import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from '../../../shared/ui/button/button';
import { Label } from '../../../shared/components/form/label/label';
import { InputField } from '../../../shared/components/form/input/input-field';
import { DatePicker } from '../../../shared/components/form/date-picker/date-picker';
import { AuthPageLayout } from '../../../shared/layout/auth-page-layout/auth-page-layout';
import { PublicSessionService } from '../../../core/service/public-session.service';
import { PUBLIC_HOME_PATH } from '../../../core/model/public-menu';

@Component({
  selector: 'app-teacher-access',
  imports: [
    ReactiveFormsModule,
    AuthPageLayout,
    Button,
    Label,
    InputField,
    DatePicker,
  ],
  templateUrl: './professor-access.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherAccess implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly publicSession = inject(PublicSessionService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    numeroDocumento: ['', [Validators.required, Validators.maxLength(20)]],
    fechaExpedicion: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.publicSession.isAuthenticated()) {
      void this.router.navigateByUrl(PUBLIC_HOME_PATH);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { numeroDocumento, fechaExpedicion } = this.form.getRawValue();
    this.isSubmitting.set(true);

    try {
      await this.publicSession.signIn({
        numeroDocumento: numeroDocumento.trim(),
        fechaExpedicion,
      });
    } catch (error) {
      console.error(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
