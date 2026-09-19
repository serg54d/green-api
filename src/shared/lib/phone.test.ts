import {
    formatPhoneNumber,
    normalizePhoneNumber,
} from './phone';

describe('phone', () => {
    describe('normalizePhoneNumber', () => {
        it('нормализует российский номер', () => {
            expect(normalizePhoneNumber('+7 (999) 123-45-67')).toBe(
                '79991234567',
            );
        });

        it('заменяет начальную 8 на 7', () => {
            expect(normalizePhoneNumber('8 999 123 45 67')).toBe(
                '79991234567',
            );
        });

        it('нормализует белорусский номер', () => {
            expect(normalizePhoneNumber('+375 (29) 123-45-67')).toBe(
                '375291234567',
            );
        });

        it('не принимает буквы', () => {
            expect(normalizePhoneNumber('+7 abc 123')).toBeNull();
        });

        it('не принимает пустую строку', () => {
            expect(normalizePhoneNumber('')).toBeNull();
        });
    });

    describe('formatPhoneNumber', () => {
        it('добавляет плюс к номеру', () => {
            expect(formatPhoneNumber('79991234567')).toBe(
                '+79991234567',
            );
        });
    });
});
