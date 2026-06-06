export function envString(
  key: string,
  defaultValue?: string,
): string | undefined {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

export function envInt(key: string, defaultValue: number): number {
  const raw = envString(key);
  if (raw === undefined) {
    return defaultValue;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export function envBool(key: string, defaultValue = false): boolean {
  const value = envString(key);
  if (value === undefined) {
    return defaultValue;
  }
  return value === 'true';
}

/** True unless the variable is explicitly set to "false". */
export function envEnabled(key: string, defaultEnabled = true): boolean {
  const value = envString(key);
  if (value === undefined) {
    return defaultEnabled;
  }
  return value !== 'false';
}

export function envCsv(key: string, defaultValue: string[]): string[] {
  const value = envString(key);
  if (!value) {
    return defaultValue;
  }
  return value.split(',').map((entry) => entry.trim());
}
