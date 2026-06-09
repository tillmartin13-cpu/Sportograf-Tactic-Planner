const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const EVENT_CODE_LENGTH = 4;

export function generateEventCode(length = EVENT_CODE_LENGTH) {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function normalizeEventCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, EVENT_CODE_LENGTH);
}

export function isValidEventCode(value) {
  const code = normalizeEventCode(value);
  return code.length === EVENT_CODE_LENGTH;
}
