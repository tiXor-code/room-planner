import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans-next', display: 'swap' });

export const metadata: Metadata = {
  title: 'Room Planner',
  description:
    'A 2D top-down room planner: add rooms and furniture, combine boxes into one piece, measure everything in metric, and connect rooms with doors.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
