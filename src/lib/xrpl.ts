import { IssuedCurrencyAmount, RippledError, isValidClassicAddress } from 'xrpl';

const HEX_CURRENCY = /^[0-9A-Fa-f]{40}$/;

/**
 * Converts a user-entered currency code to the form the ledger expects.
 * 3-character codes are used as-is; longer codes (e.g. "SOLO") are
 * hex-encoded and right-padded to 160 bits.
 */
export const encodeCurrency = (code: string): string => {
  const trimmed = code.trim();
  if (HEX_CURRENCY.test(trimmed)) return trimmed.toUpperCase();
  if (trimmed.toUpperCase() === 'XRP') {
    throw new Error('XRP is not an issued currency');
  }
  if (trimmed.length === 3) return trimmed;

  const bytes = new TextEncoder().encode(trimmed);
  if (bytes.length < 3 || bytes.length > 20) {
    throw new Error('Currency code must be 3 to 20 characters');
  }
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return hex.padEnd(40, '0').toUpperCase();
};

/** Converts a ledger currency code back to something readable. */
export const decodeCurrency = (code: string): string => {
  if (!HEX_CURRENCY.test(code) || code.startsWith('00')) return code;
  const bytes = code.match(/../g)!.map((h) => parseInt(h, 16)).filter((b) => b !== 0);
  return new TextDecoder().decode(new Uint8Array(bytes));
};

export interface TokenInput {
  currency: string;
  issuer: string;
  value?: string;
}

export const toTokenAmount = ({ currency, issuer, value }: TokenInput): IssuedCurrencyAmount => {
  const trimmedIssuer = issuer.trim();
  if (!isValidClassicAddress(trimmedIssuer)) {
    throw new Error('Invalid issuer address');
  }
  return {
    currency: encodeCurrency(currency),
    issuer: trimmedIssuer,
    value: value ?? '0',
  };
};

/** Returns the rippled error code (e.g. "actNotFound") if the error came from the server. */
export const rippledErrorCode = (error: unknown): string | undefined => {
  if (error instanceof RippledError) {
    return (error.data as { error?: string } | undefined)?.error;
  }
  return undefined;
};

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
