import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TASTORY — Where Taste Meets Story | 5-Year Culture SNS',
  description:
    'TASTORY is a location-based culture SNS where your taste becomes your story. Curate your favorite movies, music, books, and games from 2021 to 2025, explore city taste stories, and export high-resolution PNG story cards.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100 flex flex-col pb-16 md:pb-0">
        <AuthProvider>
          <Suspense fallback={<div className="h-16 border-b border-zinc-800/80 bg-zinc-950/85" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
