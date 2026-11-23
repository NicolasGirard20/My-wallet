import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'My Wallet — Billetera virtual',
  description: 'Administrá tus ingresos, gastos, ahorros e inversiones personales.',
  generator: 'v0.app',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
}

const THEME_INIT_SCRIPT = `(function(){try{var d={obsidian:1,midnight:1,espresso:1};var a={classic:1,"warm-paper":1,"nordic-slate":1,"soft-lavender":1,obsidian:1,midnight:1,espresso:1};var s=localStorage.getItem("mywallet.themePalette");var p=s&&a[s]?s:"classic";var r=document.documentElement;r.setAttribute("data-palette",p);r.classList.remove("light","dark");r.classList.add(d[p]?"dark":"light");}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
