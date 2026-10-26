import { forNext } from '../../../../core/utils/for-next.function';
import { DirectLearningActivity } from './professor-activities-modal.models';

export function flattenDirectActivities(
  directByCodigo: Record<string, DirectLearningActivity[]>,
): DirectLearningActivity[] {
  const rows: DirectLearningActivity[] = [];
  forNext(Object.keys(directByCodigo), (codigo) => {
    forNext(directByCodigo[codigo], (activity) => {
      rows.push(activity);
    });
  });
  return rows;
}
