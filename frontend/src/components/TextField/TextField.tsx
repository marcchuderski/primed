import { useId, type InputHTMLAttributes } from 'react';
import styles from './TextField.module.css';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
}

export function TextField({ label, hint, className, ...rest }: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className={[styles['field'], className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={styles['label']}>
        {label}
      </label>
      <input
        {...rest}
        id={id}
        className={styles['input']}
        aria-describedby={hint === undefined ? undefined : hintId}
      />
      {hint !== undefined && (
        <p id={hintId} className={styles['hint']}>
          {hint}
        </p>
      )}
    </div>
  );
}
