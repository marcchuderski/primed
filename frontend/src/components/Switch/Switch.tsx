import styles from './Switch.module.css';

/** On/off switch (native button with role="switch"). */
export function Switch({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles['switch']}
      disabled={disabled}
      onClick={() => {
        onChange(!checked);
      }}
    >
      <span className={styles['knob']} aria-hidden="true" />
    </button>
  );
}
