import type {Metadata} from 'next';
import type {ReactNode} from 'react';

import AppLayout from './(init)/layout/AppLayout';
import AntdConfigProviderWrapper from './(init)/providers/AntdConfigProviderWrapper';
import {AuthProvider} from '@/shared/auth';
import {ChatProvider} from './(init)/providers/ChatProvider';
import NoSSR from './(init)/providers/NoSSR';

import './(init)/styles/globals.scss';

export const metadata: Metadata = {
  title: 'MAX Chat',
  description: 'MAX messaging client powered by GREEN-API',
};

export default function RootLayout({
                                     children,
                                   }: {
  children: ReactNode;
}) {
  return (
      <html lang="ru">
      <body>
      <NoSSR>
        <AntdConfigProviderWrapper>
          <AuthProvider>
              <ChatProvider>
            <AppLayout>
              {children}
            </AppLayout>
              </ChatProvider>
          </AuthProvider>
        </AntdConfigProviderWrapper>
      </NoSSR>
      </body>
      </html>
  );
}
