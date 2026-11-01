import './globals.css';

export const metadata = {
  title: 'Agenda+',
  description: 'Acesse sua conta no Agenda+.',
  icons: {
    icon: '/agenda-plus-transparent.png',
    apple: '/agenda-plus-transparent.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
