import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CustomerList } from './customer-list'

interface SearchParams {
  search?: string
  page?: string
}

async function getCustomers(
  userId: string,
  role: string,
  departmentId?: string,
  search?: string,
  page: number = 1
) {
  const pageSize = 20
  const skip = (page - 1) * pageSize

  // 根据角色构建查询条件
  let where: Record<string, unknown> = { status: 'ASSIGNED' }
  
  if (role === 'SALES') {
    where.ownerId = userId
  } else if (role === 'MANAGER' && departmentId) {
    where.owner = { departmentId }
  }
  // ADMIN 可以看所有

  // 搜索条件
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
      skip,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ])

  return {
    customers,
    total,
    pageSize,
    currentPage: page,
    totalPages: Math.ceil(total / pageSize),
  }
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) return null

  const params = await searchParams
  const { id: userId, role, departmentId } = session.user
  const search = params.search || ''
  const page = parseInt(params.page || '1')

  const data = await getCustomers(userId, role, departmentId, search, page)

  return (
    <div className="space-y-6">
      <CustomerList
        customers={data.customers}
        total={data.total}
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        search={search}
        userRole={role}
      />
    </div>
  )
}
