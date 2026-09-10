import type { Metadata } from 'next';
import { Nunito, IBM_Plex_Mono } from 'next/font/google';
import '@/styles/globals.css';

// Mismas familias que el proyecto original (app/consola.html): Nunito para
// texto, IBM Plex Mono para cifras (var(--f) / var(--m) en globals.css).
const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Cardioheal — Antonio Velázquez',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${nunito.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
