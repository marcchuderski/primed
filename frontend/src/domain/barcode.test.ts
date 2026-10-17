import { isValidBarcode } from './barcode.ts';

describe('isValidBarcode', () => {
  it.each(['4006381333931', '96385074', '036000291452', '4250519647234'])('accepts %s', (code) => {
    expect(isValidBarcode(code)).toBe(true);
  });

  it.each(['4006381333932', '123', '40063813339a1', '4006381333931 '])('rejects %s', (code) => {
    expect(isValidBarcode(code)).toBe(false);
  });
});
