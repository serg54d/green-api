'use client';

import dynamic from 'next/dynamic';
import type {ReactNode} from 'react';

const NoSSR = ({children}: {children: ReactNode}) => <>{children}</>;

export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false,
  loading: () => <div role="status" aria-label="Loading" className="app-loading" />,
});
