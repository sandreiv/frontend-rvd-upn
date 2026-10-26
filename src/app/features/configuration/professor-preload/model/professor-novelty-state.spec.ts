import { describe, expect, it } from 'vitest';
import { isProfessorNoveltyPendingReview } from './professor-novelty-state';

describe('isProfessorNoveltyPendingReview', () => {
  it('es verdadera cuando el estado de novedad es 0', () => {
    expect(isProfessorNoveltyPendingReview(0)).toBe(true);
    expect(isProfessorNoveltyPendingReview('0')).toBe(true);
  });

  it('es falsa si no hay novedad en revision', () => {
    expect(isProfessorNoveltyPendingReview(1)).toBe(false);
    expect(isProfessorNoveltyPendingReview('1')).toBe(false);
    expect(isProfessorNoveltyPendingReview(null)).toBe(false);
    expect(isProfessorNoveltyPendingReview(undefined)).toBe(false);
    expect(isProfessorNoveltyPendingReview('')).toBe(false);
  });
});
