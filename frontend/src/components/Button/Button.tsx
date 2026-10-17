import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'tonal';
  size?: 'default' | 'large';
  block?: boolean;
  /** Shows the busy state: disables the button and sets aria-busy. */
  busy?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'default',
  block = false,
  busy = false,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    styles['button'],
    styles[variant],
    size === 'large' ? styles['large'] : undefined,
    block ? styles['block'] : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...rest}
      type={type}
      className={classes}
      disabled={disabled === true || busy}
      aria-busy={busy || undefined}
    >
      {children}
    </button>
  );
}
