import type { Metadata } from 'next';
import './globals.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'El Diván · Mundo Psicoanalítico', description: 'Librería especializada en psicoanálisis y psicología en México.' };
export default function RootLayout({children}: {children: React.ReactNode}) { return <html lang="es-MX"><body>{children}</body></html> }
