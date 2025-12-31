import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限' }, { status: 403 })
    }

    const settings = await request.json()

    // 更新或创建配置
    for (const [key, value] of Object.entries(settings)) {
      await prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    }

    // 记录日志
    await prisma.systemLog.create({
      data: {
        action: 'UPDATE_SETTINGS',
        target: 'SystemConfig',
        detail: `更新系统配置: ${JSON.stringify(settings)}`,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
