import styles from './FilterPill.module.css';

export interface FilterPillProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

/**
 * FilterPill
 *
 * A tab-style filter button that displays a label and a count badge.
 * When active, shows a 3px bottom border in var(--red).
 *
 * Validates: Requirements 10.8
 */
export function FilterPill({ label, count, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      className={`${styles.pill} ${active ? styles.active : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
      <span className={styles.count}>{count}</span>
    </button>
  );
}

export default FilterPill;
