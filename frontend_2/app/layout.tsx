import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TheNeural Playground - Machine Learning for Kids',
  description: 'Teach kids machine learning by building fun text classification projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
