import { Check, Copy, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/Button/Button.tsx';
import { Sheet } from '../../components/Sheet/Sheet.tsx';
import { AI_LINKS, GUIDANCE_PROMPT } from './guidancePrompt.ts';
import styles from './GuidanceSheet.module.css';
import common from './Settings.module.css';

const STEPS = [
  ['Fragebogen kopieren', 'mit dem Button unten'],
  ['KI deiner Wahl öffnen', 'und den Text einfügen'],
  ['Fragen beantworten', 'eine nach der anderen'],
  ['Ergebnis hier eintragen', 'Protein-Standard, Tagesarten, Wochenvorlage'],
] as const;

/** Screen 20 "Richtwerte ermitteln": copy the questionnaire into an AI of your choice. */
export function GuidanceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [full, setFull] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const id = window.setTimeout(() => {
      setCopied(false);
    }, 2000);
    return () => {
      window.clearTimeout(id);
    };
  }, [copied]);

  useEffect(() => {
    if (copyFailed) {
      textRef.current?.focus();
      textRef.current?.select();
    }
  }, [copyFailed]);

  async function copy() {
    try {
      // Clipboard only on this explicit tap (D-108).
      await navigator.clipboard.writeText(GUIDANCE_PROMPT);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      // Fallback: show the whole text, selected, so it can be copied by hand.
      setFull(true);
      setCopyFailed(true);
    }
  }

  return (
    <Sheet
      open={open}
      title="Richtwerte ermitteln"
      subtitle="Eine KI fragt dich Schritt für Schritt ab und gibt dir am Ende eine fertige Tabelle für Primed."
      onClose={onClose}
      tone="bg"
    >
      <div className={styles['body']}>
        <ol className={styles['steps']}>
          {STEPS.map(([title, sub], i) => (
            <li key={title}>
              <span className={styles['num']} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles['stepTexts']}>
                <span className={styles['stepTitle']}>{title}</span>
                <span className={styles['stepSub']}>{sub}</span>
              </span>
            </li>
          ))}
        </ol>

        <section className={common['section']} aria-labelledby="guidance-prompt">
          <h3 id="guidance-prompt" className={common['sectionLabel']}>
            Fragebogen
          </h3>
          {full ? (
            <textarea
              ref={textRef}
              className={styles['full']}
              readOnly
              value={GUIDANCE_PROMPT}
              aria-label="Fragebogen"
              rows={14}
            />
          ) : (
            <div className={styles['preview']} aria-hidden="true">
              {GUIDANCE_PROMPT.slice(0, 420)}
            </div>
          )}
          {!full && (
            <button
              type="button"
              className={styles['showAll']}
              onClick={() => {
                setFull(true);
              }}
            >
              Ganzen Fragebogen anzeigen
            </button>
          )}
          {copyFailed && (
            <p className={common['hint']} role="status">
              Kopieren hat nicht geklappt. Der Text ist markiert – kopiere ihn bitte von Hand.
            </p>
          )}
        </section>

        <Button size="large" block onClick={() => void copy()}>
          {copied ? (
            <>
              <Check size={20} strokeWidth={2.2} aria-hidden="true" /> Kopiert
            </>
          ) : (
            <>
              <Copy size={20} strokeWidth={2.2} aria-hidden="true" /> Fragebogen kopieren
            </>
          )}
        </Button>

        <section className={common['section']} aria-labelledby="guidance-links">
          <h3 id="guidance-links" className={common['sectionLabel']}>
            Dann einfügen in
          </h3>
          <ul className={styles['links']}>
            {AI_LINKS.map((link) => (
              <li key={link.name}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  <span>{link.name}</span>
                  <ExternalLink size={18} strokeWidth={2.2} aria-hidden="true" />
                  <span className={styles['srOnly']}> (öffnet in neuem Tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <div className={styles['notes']}>
          <p>
            <strong>Hinweis:</strong> Kein Ersatz für ärztliche oder ernährungsfachliche Beratung. Die Werte
            sind unverbindliche Richtwerte, die eine KI aus deinen Angaben berechnet; Primed übernimmt dafür
            keine Gewähr. Bei Erkrankungen, Schwangerschaft, Stillzeit oder Essstörungen sprich bitte mit
            einer Ärztin, einem Arzt oder einer Ernährungsfachkraft.
          </p>
          <p>Deine Antworten gehen an den Anbieter, den du wählst. Primed sendet dabei nichts.</p>
        </div>
      </div>
    </Sheet>
  );
}
