import {
  generateHolderCode,
  inviteLink,
  mintLink,
  parseInviteFragment,
  parseMintFragment,
} from '../../midnight/invite-links';

const ORG = 'ab'.repeat(32);
const EVENT = 'cd'.repeat(32);
const CODE = `${'11'.repeat(32)}.${'22'.repeat(32)}`;

describe('invite-links', () => {
  it('round-trips the invite link through its fragment', () => {
    const url = inviteLink('https://app.test', ORG, EVENT);
    expect(url).toBe(`https://app.test/app/key#organizer=${ORG}&event=${EVENT}`);
    expect(parseInviteFragment(new URL(url).hash)).toEqual({ organizerPkHex: ORG, eventIdHex: EVENT });
  });

  it('rejects invite fragments without a valid organizer key or with a bad event id', () => {
    expect(parseInviteFragment('')).toBeNull();
    expect(parseInviteFragment('#organizer=xyz')).toBeNull();
    expect(parseInviteFragment(`#organizer=${ORG}&event=nope`)).toBeNull();
    expect(parseInviteFragment(`#organizer=${ORG.toUpperCase()}`)).toEqual({ organizerPkHex: ORG, eventIdHex: null });
  });

  it('round-trips the mint link, with and without an event', () => {
    const withEvent = mintLink('https://app.test', CODE, EVENT);
    expect(parseMintFragment(new URL(withEvent).hash)).toEqual({ holderCode: CODE, eventIdHex: EVENT });
    const without = mintLink('https://app.test', CODE);
    expect(without).toBe(`https://app.test/app/mint#to=${CODE}`);
    expect(parseMintFragment(new URL(without).hash)).toEqual({ holderCode: CODE, eventIdHex: null });
  });

  it('accepts old codes without an encryption key, rejects anything else', () => {
    expect(parseMintFragment(`#to=${'11'.repeat(32)}`)).toEqual({ holderCode: '11'.repeat(32), eventIdHex: null });
    expect(parseMintFragment('#to=hello')).toBeNull();
    expect(parseMintFragment(`#to=${CODE}&event=zz`)).toBeNull();
  });

  it('generates the holder code from the two derived keys', async () => {
    const service = {
      getHolderPkHex: jest.fn().mockResolvedValue('11'.repeat(32)),
      getEncryptionKeyPair: jest.fn().mockResolvedValue({ publicKeyHex: '22'.repeat(32) }),
    };
    await expect(generateHolderCode(service, ORG)).resolves.toBe(CODE);
    expect(service.getHolderPkHex).toHaveBeenCalledWith(Uint8Array.from(Buffer.from(ORG, 'hex')));
  });
});
