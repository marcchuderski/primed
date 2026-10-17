/**
 * Shown only while the session check runs (usually well under a second): plain background,
 * no animation. Logged-in users go straight to the app; the logo animation lives on the login screen.
 */
export function StartupScreen() {
  return <main aria-busy="true" aria-label="Primed lädt" />;
}
