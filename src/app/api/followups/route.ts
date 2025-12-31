import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const followUpSchema = z.object({
  customerId: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['PHONE', 'WECHAT', 'VISIT', 'EMAIL', 'OTHER']),
  nextFollowUpAt: z.string().nullable().optional(),
})

// 创建跟进记录
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const data = followUpSchema.parse(body)

    // 检查客户是否存在且属于当前用户
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    })

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 })
    }

    if (customer.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '无权操作此客户' }, { status: 403 })
    }

    // 创建跟进记录并更新客户最后跟进时间
    const [followUp] = await prisma.$transaction([
      prisma.followUp.create({
        data: {
          content: data.content,
          type: data.type,
          customerId: data.customerId,
          userId: session.user.id,
          nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
        },
      }),
      prisma.customer.update({
        where: { id: data.customerId },
        data: { lastFollowUpAt: new Date() },
      }),
      prisma.systemLog.create({
        data: {
          action: 'CREATE_FOLLOWUP',
          target: 'FollowUp',
          targetId: data.customerId,
          detail: `添加跟进记录: ${data.content.substring(0, 50)}...`,
          userId: session.user.id,
        },
      }),
    ])

    return NextResponse.json(followUp)
  } catch (error) {
    console.error('Create followup error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '数据格式错误' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
