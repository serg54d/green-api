'use client';

import {navItems, settingsItems} from '../const';
import NavMenu from './NavMenu';
import styles from './Sidebar.module.scss';

export default function Sidebar() {
  return (
    <aside className={styles.root}>
      <NavMenu items={navItems} />

      <NavMenu items={settingsItems} />
    </aside>
  );
}
