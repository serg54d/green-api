import {isSupportedPhoneNumber} from './phone';

describe('isSupportedPhoneNumber', () => {
  it('принимает номер России', () => {
    expect(isSupportedPhoneNumber('79991234567')).toBe(true);
  });

  it('принимает номер Беларуси', () => {
    expect(isSupportedPhoneNumber('375291234567')).toBe(true);
  });

  it('не принимает номер неверной длины', () => {
    expect(isSupportedPhoneNumber('7999123456')).toBe(false);
  });

  it('не принимает номер неподдерживаемой страны', () => {
    expect(isSupportedPhoneNumber('14155552671')).toBe(false);
  });
});
