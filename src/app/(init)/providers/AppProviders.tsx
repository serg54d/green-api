'use client';

import {App, ConfigProvider} from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type {ReactNode} from 'react';

import {theme} from '@/shared/config/theme';

export default function AppProviders({children}: {children: ReactNode}) {
  return (
    <ConfigProvider locale={ruRU} theme={theme}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
