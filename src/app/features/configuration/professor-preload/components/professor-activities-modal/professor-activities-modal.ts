import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import {
  ProfessorLoadItem,
  professorLoadDisplayName,
} from '../../model/professor-load.model';

@Component({
  selector: 'app-professor-activities-modal',
  imports: [Modal, Button, Icon],
  templateUrl: './professor-activities-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorActivitiesModal {
  readonly isOpen = input(false);
  readonly professor = input<ProfessorLoadItem | null>(null);
  readonly linkageLabel = input('');
  readonly coordinationLabel = input('');
  readonly periodLabel = input('');
  readonly close = output<void>();

  readonly professorDisplayName = computed(() => {
    const professor = this.professor();
    return professor ? professorLoadDisplayName(professor) : 'NN';
  });

  readonly linkageText = computed(
    () => this.linkageLabel().trim() || '-',
  );

  readonly coordinationText = computed(
    () => this.coordinationLabel().trim() || '-',
  );
}
