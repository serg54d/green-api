'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';

import type {NavMenuItem} from '../const';
import styles from './Sidebar.module.scss';

type Props = {
  items: NavMenuItem[];
};

export default function NavMenu({items}: Props) {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.key;

        return (
          <Link
            key={item.key}
            href={item.key}
            className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={24} strokeWidth={2.2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
