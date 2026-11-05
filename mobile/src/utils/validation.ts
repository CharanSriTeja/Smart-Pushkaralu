/**
 * Validates Indian 10-digit mobile phone numbers.
 * Supports numbers starting with 6, 7, 8, or 9.
 * Handles prefix '+91' or '91' or leading 0.
 */
export function validateIndianPhoneNumber(rawInput: string): {
  isValid: boolean;
  cleanNumber: string;
  e164Format: string;
  errorMessageKey?: string;
} {
  if (!rawInput) {
    return {
      isValid: false,
      cleanNumber: '',
      e164Format: '',
      errorMessageKey: 'phone.error_invalid',
    };
  }

  // Remove spaces, hyphens, and non-digit characters except leading +
  let cleaned = rawInput.trim().replace(/[\s-]/g, '');

  // Strip country code if present
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Check if exactly 10 digits and starts with 6, 7, 8, or 9
  const indianMobileRegex = /^[6-9]\d{9}$/;
  const isValid = indianMobileRegex.test(cleaned);

  return {
    isValid,
    cleanNumber: cleaned,
    e164Format: isValid ? `+91${cleaned}` : '',
    errorMessageKey: isValid ? undefined : 'phone.error_invalid',
  };
}

/**
 * Formats a 10-digit number for display: "+91 98765 43210"
 */
export function formatPhoneNumberForDisplay(phone: string): string {
  const { cleanNumber } = validateIndianPhoneNumber(phone);
  if (cleanNumber.length === 10) {
    return `+91 ${cleanNumber.slice(0, 5)} ${cleanNumber.slice(5)}`;
  }
  return phone;
}

