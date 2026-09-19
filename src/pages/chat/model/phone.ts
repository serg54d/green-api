export function isSupportedPhoneNumber(phoneNumber: string): boolean {
  return /^7\d{10}$/.test(phoneNumber) || /^375\d{9}$/.test(phoneNumber);
}
