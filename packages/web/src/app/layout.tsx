import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Currency Converter',
  description: 'Convert between USD and world currencies',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
