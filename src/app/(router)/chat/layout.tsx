import type {ReactNode} from 'react';

import AuthGuard from '@/app/(init)/guards/AuthGuard';

type Props = {
  children: ReactNode;
};

export default function ChatLayout({children}: Props) {
  return <AuthGuard>{children}</AuthGuard>;
}
