

export function nanos() {
  const hrtime = process.hrtime();
  return hrtime[0] * 1e9 + hrtime[1];
}

export function micros() {
  const hrtime = process.hrtime();
  return hrtime[0] * 1e6 + hrtime[1] * 1e-3;
}

export function millis() {
  const hrtime = process.hrtime();
  return hrtime[0] * 1e3 + hrtime[1] * 1e-6;
}
