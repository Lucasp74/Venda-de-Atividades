import '@payloadcms/next/css'
import './custom/admin.css'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import type { ServerFunctionClient } from 'payload'
import React from 'react'
import { importMap } from './admin/importMap.js'

export default async function Layout({ children }: { children: React.ReactNode }) {
  const serverFunction: ServerFunctionClient = async (args) => {
    'use server'
    return handleServerFunctions({ ...args, config, importMap })
  }

  return RootLayout({
    children,
    config,
    importMap,
    serverFunction,
    htmlProps: { suppressHydrationWarning: true },
  })
}
