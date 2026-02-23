import type { ReactNode } from 'react';

import { ManagerNav } from '@/components/ManagerNav';

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ManagerNav />
      <main style={{ maxWidth: 1100, margin: '24px auto', padding: '0 20px', fontSize: 18, lineHeight: 1.5 }}>{children}</main>
    </>
  );
}
