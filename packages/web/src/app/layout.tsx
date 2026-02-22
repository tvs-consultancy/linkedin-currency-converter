import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Conversor de Divisas',
  description: 'Convierte entre USD y divisas del mundo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
