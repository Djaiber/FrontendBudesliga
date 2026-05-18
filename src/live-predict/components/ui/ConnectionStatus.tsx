import { useState, useEffect } from 'react';
import { websocket } from '../../transport/websocket';
import type { ConnectionState } from '../../transport/websocket';
import { useTranslation } from '../../hooks/useTranslation';
import styles from './ConnectionStatus.module.css';

const DOT_CLASS: Record<ConnectionState, string> = {
  idle:         styles.dotClosed,
  connecting:   styles.dotConnecting,
  open:         styles.dotOpen,
  closed:       styles.dotClosed,
  reconnecting: styles.dotConnecting,
};

const LABEL_KEY: Record<ConnectionState, Parameters<ReturnType<typeof useTranslation>['t']>[0]> = {
  idle:         'room.connection.closed',
  connecting:   'room.connection.connecting',
  open:         'room.connection.open',
  closed:       'room.connection.closed',
  reconnecting: 'room.connection.connecting',
};

export function ConnectionStatus() {
  const [state, setState] = useState<ConnectionState>(websocket.connectionState);
  const { t } = useTranslation();

  useEffect(() => websocket.onStateChange(setState), []);

  const label = t(LABEL_KEY[state]);

  return (
    <div className={styles.wrapper} title={label} aria-label={label}>
      <span className={`${styles.dot} ${DOT_CLASS[state]}`} />
    </div>
  );
}
