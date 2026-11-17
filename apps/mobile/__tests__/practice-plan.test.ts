import { buildDuePracticePlan, emptyProgress } from '@speeko/core';

describe('mobile practice plan', () => {
  it('returns an empty plan when there is no progress', () => {
    const course = {
      id: 'hi-starter',
      locale: 'hi',
      units: [],
    } as any;
    const plan = buildDuePracticePlan(course, emptyProgress(), Date.now(), 10);
    expect(plan.exercises).toEqual([]);
    expect(plan.matched).toBe(0);
  });
});