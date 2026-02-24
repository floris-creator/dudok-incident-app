import type { ReactNode } from 'react';

import { ManagerNav } from '@/components/ManagerNav';

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ManagerNav />
      <main className="manager-main">{children}</main>
    </>
  );
}
