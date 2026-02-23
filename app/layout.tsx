import './globals.css';

import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body style={{ fontFamily: '"Avenir Next", "Segoe UI", sans-serif', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
