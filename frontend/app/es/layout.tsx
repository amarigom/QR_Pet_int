import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

interface EsLayoutProps {
  children: ReactNode
}

export default async function EsLayout({ children }: EsLayoutProps) {
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale="es" messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
