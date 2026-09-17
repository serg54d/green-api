import type {Metadata} from 'next';
import type {ReactNode} from 'react';

import AppLayout from './(init)/layout/AppLayout';
import AppProviders from './(init)/providers/AppProviders';
import NoSSR from './(init)/providers/NoSSR';
import './(init)/styles/globals.scss';

export const metadata: Metadata = {
  title: 'MAX Chat',
  description: 'MAX messaging client powered by GREEN-API',
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="ru">
      <body>
        <NoSSR>
          <AppProviders>
            <AppLayout>{children}</AppLayout>
          </AppProviders>
        </NoSSR>
      </body>
    </html>
  );
}
