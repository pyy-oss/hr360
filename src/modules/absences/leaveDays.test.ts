import { describe, it, expect } from 'vitest';
import { businessDays } from './leaveDays';

describe('businessDays — jours ouvrés inclusifs', () => {
  it('un seul jour ouvré (mercredi)', () => {
    expect(businessDays('2026-07-22', '2026-07-22')).toBe(1);
  });
  it('une semaine pleine lun→ven = 5', () => {
    expect(businessDays('2026-07-20', '2026-07-24')).toBe(5);
  });
  it('exclut le week-end (ven→lun = 2)', () => {
    // 2026-07-24 vendredi, 27 lundi ; samedi/dimanche exclus.
    expect(businessDays('2026-07-24', '2026-07-27')).toBe(2);
  });
  it('deux semaines = 10', () => {
    expect(businessDays('2026-07-20', '2026-07-31')).toBe(10);
  });
  it('un week-end seul = 0', () => {
    expect(businessDays('2026-07-25', '2026-07-26')).toBe(0);
  });
  it('fin avant début = 0', () => {
    expect(businessDays('2026-07-24', '2026-07-20')).toBe(0);
  });
  it('date invalide = 0', () => {
    expect(businessDays('', '2026-07-24')).toBe(0);
    expect(businessDays('2026-07-20', 'pas-une-date')).toBe(0);
  });
});
