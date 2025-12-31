import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const customerSchema = z.object({
  name: z.string().min(1),
  contactPerson: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  source: z.string().optional(),
  remark: z.string().optional(),
})

// 创建客户
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const data = customerSchema.parse(body)

    // 检查手机号是否重复
    const existing = await prisma.customer.findFirst({
      where: { phone: data.phone },
    })

    if (existing) {
      return NextResponse.json({ error: '该手机号已存在' }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        source: data.source || null,
        remark: data.remark || null,
        ownerId: session.user.id,
        status: 'ASSIGNED',
        lastFollowUpAt: new Date(),
      },
    })

    // 记录日志
    await prisma.systemLog.create({
      data: {
        action: 'CREATE_CUSTOMER',
        target: 'Customer',
        targetId: customer.id,
        detail: `创建客户: ${customer.name}`,
        userId: session.user.id,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Create customer error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '数据格式错误' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}

// 获取客户列表
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = 20

    const { id: userId, role, departmentId } = session.user

    // 根据角色构建查询条件
    let where: Record<string, unknown> = { status: 'ASSIGNED' }
    
    if (role === 'SALES') {
      where.ownerId = userId
    } else if (role === 'MANAGER' && departmentId) {
      where.owner = { departmentId }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { contactPerson: { contains: search } },
      ]
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { followUps: true, contracts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      customers,
      total,
      pageSize,
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('Get customers error:', error)
    return NextResponse.json({ error: '获取失败' }, { status: 500 })
  }
}
