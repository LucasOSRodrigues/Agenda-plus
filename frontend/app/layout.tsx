import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agenda+',
  description: 'Acesse sua conta no Agenda+.',
  icons: {
    icon: '/agenda-plus-transparent.png',
    apple: '/agenda-plus-transparent.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
