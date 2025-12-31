import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CustomerDetail } from './customer-detail'

async function getCustomer(id: string, userId: string, role: string, departmentId?: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, departmentId: true } },
      followUps: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      contracts: {
        include: {
          payments: { orderBy: { paymentDate: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!customer) return null

  // 权限检查
  if (role === 'SALES' && customer.ownerId !== userId) {
    return null
  }

  if (role === 'MANAGER' && customer.owner?.departmentId !== departmentId) {
    return null
  }

  return customer
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) return null

  const { id } = await params
  const { id: userId, role, departmentId } = session.user

  const customer = await getCustomer(id, userId, role, departmentId)

  if (!customer) {
    notFound()
  }

  return <CustomerDetail customer={customer} userRole={role} userId={userId} />
}
