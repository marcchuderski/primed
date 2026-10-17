// Regression guard for the security headers in public/.htaccess (docs/SECURITY.md).
import htaccess from '../../public/.htaccess?raw';

function header(name: string): string {
  const match = new RegExp(`Header always set ${name} "([^"]+)"`).exec(htaccess);
  if (!match?.[1]) {
    throw new Error(`Header ${name} missing`);
  }
  return match[1];
}

describe('web root .htaccess', () => {
  it('sets a strict CSP without unsafe sources', () => {
    const csp = header('Content-Security-Policy');
    expect(csp).not.toMatch(/unsafe-(inline|eval|hashes)/);
    expect(csp).not.toMatch(/\*|https?:|data:/);
    for (const directive of [
      "default-src 'none'",
      "script-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      "object-src 'none'",
      "form-action 'self'",
    ]) {
      expect(csp).toContain(directive);
    }
  });

  it('sets HSTS for one year without preload', () => {
    const hsts = header('Strict-Transport-Security');
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).not.toContain('preload');
  });

  it('sets the remaining hardening headers', () => {
    expect(header('X-Content-Type-Options')).toBe('nosniff');
    expect(header('X-Frame-Options')).toBe('DENY');
    expect(header('Referrer-Policy')).toBe('no-referrer');
    expect(header('Permissions-Policy')).toContain('camera=(self)');
    expect(header('Permissions-Policy')).toContain('microphone=()');
    expect(header('Cross-Origin-Opener-Policy')).toBe('same-origin');
  });

  it('blocks dotfiles and enforces HTTPS', () => {
    expect(htaccess).toContain('RewriteRule (^|/)\\.(?!well-known/) - [F,L]');
    expect(htaccess).toMatch(/RewriteRule \^ https:\/\/%\{HTTP_HOST\}%\{REQUEST_URI\} \[R=301,L\]/);
  });
});
