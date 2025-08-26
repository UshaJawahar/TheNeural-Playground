import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TheNeural Playground",
  description: "Machine Learning for Kids - Learn AI through interactive projects",
  icons: {
    icon: [
      { url: '/Neural Logo-Light Green.png', sizes: '32x32', type: 'image/png' },
      { url: '/Neural Logo-Light Green.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/Neural Logo-Light Green.png',
    apple: '/Neural Logo-Light Green.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Neural Logo-Light Green.png" sizes="32x32" />
        <link rel="shortcut icon" href="/Neural Logo-Light Green.png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/Neural Logo-Light Green.png" sizes="180x180" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
