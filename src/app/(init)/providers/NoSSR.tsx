'use client';

import dynamic from 'next/dynamic';
import type {ReactNode} from 'react';

const NoSSR = ({children}: {children: ReactNode}) => <>{children}</>;

export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false,
  loading: () => (
    <div role="status" aria-label="Загрузка" className="app-loading-container">
      <div className="app-loading" aria-hidden="true" />
    </div>
  ),
});
