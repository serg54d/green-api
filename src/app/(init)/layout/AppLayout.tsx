import type {ReactNode} from 'react';

import Sidebar from './Sidebar/Sidebar';
import styles from './AppLayout.module.scss';

export default function AppLayout({children}: {children: ReactNode}) {
  return (
    <div className={styles.root}>
      <Sidebar />

      <main className={styles.content}>{children}</main>
    </div>
  );
}
