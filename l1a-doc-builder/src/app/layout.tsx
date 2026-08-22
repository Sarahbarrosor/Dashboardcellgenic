import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'L1A Doc Builder',
  description: 'Ensamblador de expedientes L-1A. No inventa hechos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
