import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { format } from 'date-fns'

const contractSchema = z.object({
  customerId: z.string().min(1),
  amount: z.number().positive(),
  signDate: z.string().min(1),
  remark: z.string().optional(),
})

// 生成合同编号
async function generateSerialNumber() {
  const today = format(new Date(), 'yyyyMMdd')
  const prefix = `CTR-${today}-`
  
  const lastContract = await prisma.contract.findFirst({
    where: { serialNumber: { startsWith: prefix } },
    orderBy: { serialNumber: 'desc' },
  })

  let sequence = 1
  if (lastContract) {
    const lastSeq = parseInt(lastContract.serialNumber.split('-').pop() || '0')
    sequence = lastSeq + 1
  }

  return `${prefix}${sequence.toString().padStart(3, '0')}`
}

// 创建合同
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const data = contractSchema.parse(body)

    // 检查客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    })

    if (!customer) {
      return NextResponse.json({ error: '客户不存在' }, { status: 404 })
    }

    // 生成合同编号
    const serialNumber = await generateSerialNumber()

    const contract = await prisma.contract.create({
      data: {
        serialNumber,
        amount: data.amount,
        signDate: new Date(data.signDate),
        remark: data.remark || null,
        customerId: data.customerId,
        status: 'EXECUTING',
      },
    })

    // 记录日志
    await prisma.systemLog.create({
      data: {
        action: 'CREATE_CONTRACT',
        target: 'Contract',
        targetId: contract.id,
        detail: `创建合同: ${serialNumber}, 金额: ${data.amount}`,
        userId: session.user.id,
      },
    })

    return NextResponse.json(contract)
  } catch (error) {
    console.error('Create contract error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '数据格式错误' }, { status: 400 })
    }
    return NextResponse.json({ error: '创建失败' }, { status: 500 })
  }
}
