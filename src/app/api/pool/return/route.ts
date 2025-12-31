import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { customerId, reason } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: '缺少客户ID' }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ error: '请填写退回原因' }, { status: 400 })
    }

    // 检查客户是否存在且属于当前用户
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 })
    }

    // 只有客户的负责人或管理员才能退回
    if (customer.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: '无权操作此客户' }, { status: 403 })
    }

    // 退回公海
    await prisma.$transaction([
      prisma.customer.update({
        where: { id: customerId },
        data: {
          status: 'POOL',
          ownerId: null,
          returnReason: reason,
        },
      }),
      prisma.systemLog.create({
        data: {
          action: 'RETURN_CUSTOMER',
          target: 'Customer',
          targetId: customerId,
          detail: `退回客户至公海: ${customer.name}, 原因: ${reason}`,
          userId: session.user.id,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Return customer error:', error)
    return NextResponse.json({ error: '退回失败' }, { status: 500 })
  }
}
