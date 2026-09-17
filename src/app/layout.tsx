import type {Metadata} from 'next';
import type {ReactNode} from 'react';

import AppLayout from './(init)/layout/AppLayout';
import AntdConfigProviderWrapper from './(init)/providers/AntdConfigProviderWrapper';
import AuthProvider from './(init)/providers/AuthProvider';
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
            <AppLayout>
              {children}
            </AppLayout>
          </AuthProvider>
        </AntdConfigProviderWrapper>
      </NoSSR>
      </body>
      </html>
  );
}