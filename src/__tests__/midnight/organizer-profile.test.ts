import {
  ORGANIZER_PROFILE_PREFIX,
  getOrganizerProfile,
  saveOrganizerProfile,
} from '../../midnight/organizer-profile';
import { BACKUP_FORMAT } from '../../midnight/backup';
import * as backupStatus from '../../midnight/backup-status';

const PK = 'ab'.repeat(32);

describe('organizer profile', () => {
  beforeEach(() => window.localStorage.clear());

  it('saves per identity, trimmed, without empty or unknown fields', () => {
    saveOrganizerProfile(PK, { name: '  Acme  ', locality: '', country: 'AR', role: 'admin' });
    expect(getOrganizerProfile(PK)).toEqual({ name: 'Acme', country: 'AR' });
    expect(getOrganizerProfile('cd'.repeat(32))).toBeNull();
  });

  it('removes the entry when every field is empty', () => {
    saveOrganizerProfile(PK, { name: 'Acme' });
    saveOrganizerProfile(PK, { name: '   ' });
    expect(window.localStorage.getItem(`${ORGANIZER_PROFILE_PREFIX}${PK}`)).toBeNull();
    expect(getOrganizerProfile(PK)).toBeNull();
  });

  it('marks the backup as needing an upload', () => {
    const spy = jest.spyOn(backupStatus, 'markBackupDirty');
    saveOrganizerProfile(PK, { name: 'Acme' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('returns null without an identity or for unreadable data', () => {
    expect(getOrganizerProfile(undefined)).toBeNull();
    window.localStorage.setItem(`${ORGANIZER_PROFILE_PREFIX}${PK}`, '{not json');
    expect(getOrganizerProfile(PK)).toBeNull();
  });

  it('lives under a prefix the encrypted backup carries', async () => {
    expect(BACKUP_FORMAT).toBe('velum-backup');
    const source = jest.requireActual('fs').readFileSync(require.resolve('../../midnight/backup.ts'), 'utf8');
    expect(source).toMatch(/BACKED_UP_PREFIXES = \[[^\]]*ORGANIZER_PROFILE_PREFIX/);
  });
});
