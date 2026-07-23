import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import AdmZip from 'adm-zip';
import { fft, db, reqOf, clearFirestore, ORG } from './setup';
import { extractAcceptedFiles } from '../src/ingestion/extract';
import { startIngestionJob } from '../src/ingestion/startIngestionJob';

const start = fft.wrap(startIngestionJob);
const rh = { role: 'rh' };
const recruteur = { role: 'recruteur' };
const collab = { role: 'collaborateur', departmentId: 'infra', employeeId: 'e_at' };

describe('extractAcceptedFiles', () => {
  it('ne garde que pdf/doc/docx, ignore dossiers, dotfiles et __MACOSX', () => {
    const zip = new AdmZip();
    zip.addFile('cv1.pdf', Buffer.from('%PDF-1'));
    zip.addFile('cv2.docx', Buffer.from('PKdocx'));
    zip.addFile('sous/cv3.pdf', Buffer.from('%PDF-2'));
    zip.addFile('notes.txt', Buffer.from('texte'));            // ignoré (compté skipped)
    zip.addFile('__MACOSX/._cv1.pdf', Buffer.from('junk'));    // ignoré (non compté)
    const { files, skipped } = extractAcceptedFiles(zip.toBuffer());
    expect(files.map((f) => f.name).sort()).toEqual(['cv1.pdf', 'cv2.docx', 'cv3.pdf']);
    expect(skipped).toBe(1);
  });
});

describe('startIngestionJob', () => {
  beforeAll(async () => { await clearFirestore(); });
  afterAll(() => fft.cleanup());
  beforeEach(async () => {
    await clearFirestore();
    await db.doc('employees/e_at').set({ orgId: ORG, firstName: 'A', lastName: 'T', departmentId: 'infra', status: 'confirme' });
  });

  it('documents : la RH ouvre un job et reçoit un préfixe de dépôt', async () => {
    const res: any = await start(reqOf({ type: 'documents', employeeId: 'e_at', category: 'bulletin' }, rh, 'u_rh'));
    expect(res.uploadPrefix).toBe(`ingest/${ORG}/${res.jobId}/`);
    const job = await db.doc(`ingestionJobs/${res.jobId}`).get();
    expect(job.get('status')).toBe('pending');
    expect(job.get('employeeId')).toBe('e_at');
  });
  it('documents : refuse sans collaborateur', async () => {
    await expect(start(reqOf({ type: 'documents' }, rh, 'u_rh'))).rejects.toThrow();
  });
  it('documents : le recruteur ne peut pas (réservé RH)', async () => {
    await expect(start(reqOf({ type: 'documents', employeeId: 'e_at' }, recruteur, 'u_rec'))).rejects.toThrow();
  });
  it('candidates : le recruteur ouvre un job', async () => {
    const res: any = await start(reqOf({ type: 'candidates' }, recruteur, 'u_rec'));
    expect(res.ok).toBe(true);
    const job = await db.doc(`ingestionJobs/${res.jobId}`).get();
    expect(job.get('type')).toBe('candidates');
  });
  it('un collaborateur ne peut ouvrir aucun job', async () => {
    await expect(start(reqOf({ type: 'candidates' }, collab, 'u_at'))).rejects.toThrow();
  });
});
