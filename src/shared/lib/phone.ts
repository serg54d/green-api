const ALLOWED_PHONE_CHARACTERS = /^\+?[\d\s()-]+$/;

export function normalizePhoneNumber(value: string): string | null {
    const trimmedValue = value.trim();

    if (!trimmedValue || !ALLOWED_PHONE_CHARACTERS.test(trimmedValue)) {
        return null;
    }

    let phoneNumber = trimmedValue.replace(/\D/g, '');

    // Российский внутренний формат: 8XXXXXXXXXX -> 7XXXXXXXXXX.
    if (phoneNumber.length === 11 && phoneNumber.startsWith('8')) {
        phoneNumber = `7${phoneNumber.slice(1)}`;
    }

    return phoneNumber;
}

export function formatPhoneNumber(phoneNumber: string): string {
    return `+${phoneNumber}`;
}
