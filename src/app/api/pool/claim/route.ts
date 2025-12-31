import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: '缺少客户ID' }, { status: 400 })
    }

    // 获取每日领取限制
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'daily_claim_limit' },
    })
    const limit = parseInt(config?.value || '5')

    // 检查今日领取数量
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayClaimed = await prisma.claimRecord.count({
      where: {
        userId: session.user.id,
        claimedAt: { gte: today },
      },
    })

    if (todayClaimed >= limit) {
      return NextResponse.json(
        { error: `今日领取已达上限 (${limit}个)` },
        { status: 400 }
      )
    }

    // 检查客户是否在公海池
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 })
    }

    if (customer.status !== 'POOL') {
      return NextResponse.json({ error: '该客户已被领取' }, { status: 400 })
    }

    // 使用事务处理领取
    await prisma.$transaction([
      // 更新客户状态
      prisma.customer.update({
        where: { id: customerId },
        data: {
          status: 'ASSIGNED',
          ownerId: session.user.id,
          lastFollowUpAt: new Date(),
          returnReason: null,
        },
      }),
      // 记录领取
      prisma.claimRecord.create({
        data: {
          userId: session.user.id,
          customerId,
        },
      }),
      // 记录日志
      prisma.systemLog.create({
        data: {
          action: 'CLAIM_CUSTOMER',
          target: 'Customer',
          targetId: customerId,
          detail: `从公海池领取客户: ${customer.name}`,
          userId: session.user.id,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Claim customer error:', error)
    return NextResponse.json({ error: '领取失败' }, { status: 500 })
  }
}
