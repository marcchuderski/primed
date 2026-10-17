/** GTIN check digit validation (EAN-8, UPC-A, EAN-13, GTIN-14); mirrors api/src/Food/Barcode.php. */
export function isValidBarcode(code: string): boolean {
  if (!/^(\d{8}|\d{12,14})$/.test(code)) {
    return false;
  }
  const digits = Array.from(code, Number);
  const check = digits.pop();
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}
