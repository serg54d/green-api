'use client';

import '@/app/(init)/styles/antd-overrides.css';

import {ConfigProvider} from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type {ReactNode} from 'react';

import {theme} from '@/shared/config/theme';

const AntdConfigProviderWrapper = ({children}: {children: ReactNode}) => {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={theme}
      wave={{disabled: true}}
      modal={{mask: {blur: false}}}
      drawer={{mask: {blur: false}}}
    >
      {children}
    </ConfigProvider>
  );
};

export default AntdConfigProviderWrapper;
