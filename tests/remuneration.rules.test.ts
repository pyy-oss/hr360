import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { setupEnv, getEnv, as, seed, ORG } from './helpers';

beforeAll(async () => { await setupEnv(); });
afterAll(async () => { await getEnv().cleanup(); });
beforeEach(async () => { await getEnv().clearFirestore(); });

const drh     = () => as('u_drh',    { role: 'drh' });
const rh      = () => as('u_rh',     { role: 'rh' });
const lecture = () => as('u_lec',    { role: 'lecture' });
const mgr     = () => as('u_mgr',    { role: 'manager', departmentId: 'cyber', employeeId: 'e_mgr' });
const self    = () => as('u_ak',     { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_ak' });
const other   = () => as('u_zz',     { role: 'collaborateur', departmentId: 'cyber', employeeId: 'e_zz' });

describe('salaryBands — grille réservée RH/DRH, écriture serveur', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'salaryBands/junior'), { orgId: ORG, level: 'junior', label: 'P1', minAmount: 1, midAmount: 2, maxAmount: 3, currency: 'XOF' });
    });
  });
  it('RH lit la grille', async () => { await assertSucceeds(getDoc(doc(rh(), 'salaryBands/junior'))); });
  it('un manager ne lit PAS la grille', async () => { await assertFails(getDoc(doc(mgr(), 'salaryBands/junior'))); });
  it('« lecture » ne lit PAS la grille', async () => { await assertFails(getDoc(doc(lecture(), 'salaryBands/junior'))); });
  it('aucune écriture client (même DRH) sur la grille', async () => {
    await assertFails(setDoc(doc(drh(), 'salaryBands/senior'), { orgId: ORG, level: 'senior', label: 'P3', minAmount: 1, midAmount: 2, maxAmount: 3, currency: 'XOF' }));
  });
});

describe('compensations — RH/DRH + self, écriture serveur', () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'compensations/e_ak'), { orgId: ORG, employeeId: 'e_ak', departmentId: 'cyber', bandLevel: 'junior', baseSalary: 6000000, currency: 'XOF', effectiveDate: '2026-01-01' });
    });
  });
  it('la DRH lit une rémunération', async () => { await assertSucceeds(getDoc(doc(drh(), 'compensations/e_ak'))); });
  it('le collaborateur lit SA propre rémunération', async () => { await assertSucceeds(getDoc(doc(self(), 'compensations/e_ak'))); });
  it('un autre collaborateur ne lit PAS cette rémunération', async () => { await assertFails(getDoc(doc(other(), 'compensations/e_ak'))); });
  it('le manager ne lit PAS la rémunération de son équipe (confidentialité)', async () => { await assertFails(getDoc(doc(mgr(), 'compensations/e_ak'))); });
  it('aucune écriture client (même le concerné) sur sa rémunération', async () => {
    await assertFails(setDoc(doc(self(), 'compensations/e_ak'), { orgId: ORG, employeeId: 'e_ak', departmentId: 'cyber', bandLevel: 'senior', baseSalary: 99000000, currency: 'XOF', effectiveDate: '2026-01-01' }));
  });
  it('aucune écriture client par la RH sur une rémunération', async () => {
    await assertFails(setDoc(doc(rh(), 'compensations/e_zz'), { orgId: ORG, employeeId: 'e_zz', departmentId: 'cyber', bandLevel: 'junior', baseSalary: 6000000, currency: 'XOF', effectiveDate: '2026-01-01' }));
  });
});
