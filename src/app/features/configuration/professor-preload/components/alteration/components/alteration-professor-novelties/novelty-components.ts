import { Type } from '@angular/core';
import { NoveltyComponentKey } from '../../../../model/novelties.model';
import { AsignNameNn } from './asign-name-nn/asign-name-nn';
import { UpdateContractValue } from './update-contract-value/update-contract-value';
import { ChangeProfessor } from './change-professor/change-professor';
import { ChangeProfessorHours } from './change-professor-hours/change-professor-hours';
import { ChangeContractModality } from './change-contract-modality/change-contract-modality';
import { ChangeDirectActivities } from './change-direct-activities/change-direct-activities';
import { ChangeProjectActivities } from './change-project-activities/change-project-activities';

export const NOVELTY_COMPONENTS: Record<
  NoveltyComponentKey,
  Type<unknown>
> = {
  'asign-name-nn': AsignNameNn,
  'update-contract-value': UpdateContractValue,
  'change-professor': ChangeProfessor,
  'change-professor-hours': ChangeProfessorHours,
  'change-contract-modality': ChangeContractModality,
  'change-direct-activities': ChangeDirectActivities,
  'change-project-activities': ChangeProjectActivities,
};
