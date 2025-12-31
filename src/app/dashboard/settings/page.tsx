import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { SettingsForm } from './settings-form'

async function getSettings() {
  const configs = await prisma.systemConfig.findMany()
  
  const settings: Record<string, string> = {}
  configs.forEach((config) => {
    settings[config.key] = config.value
  })
  
  return settings
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) return null

  // 只有管理员可以访问
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const settings = await getSettings()

  return <SettingsForm settings={settings} />
}
