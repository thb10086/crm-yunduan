import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ContractList } from './contract-list'

async function getContracts(
  userId: string,
  role: string,
  departmentId?: string,
  search?: string,
  page: number = 1
) {
  const pageSize = 20
  const skip = (page - 1) * pageSize

  // 根据角色构建查询条件
  let where: Record<string, unknown> = {}
  
  if (role === 'SALES') {
    where.customer = { ownerId: userId }
  } else if (role === 'MANAGER' && departmentId) {
    where.customer = { owner: { departmentId } }
  }

  if (search) {
    where.OR = [
      { serialNumber: { contains: search } },
      { customer: { name: { contains: search } } },
    ]
  }

  const [contracts, total] = await Promise.all([
    prisma.contract.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, contactPerson: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.contract.count({ where }),
  ])

  return {
    contracts,
    total,
    pageSize,
    currentPage: page,
    totalPages: Math.ceil(total / pageSize),
  }
}

interface SearchParams {
  search?: string
  page?: string
}

export default async function ContractsPage({
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

  const data = await getContracts(userId, role, departmentId, search, page)

  return (
    <div className="space-y-6">
      <ContractList
        contracts={data.contracts}
        total={data.total}
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        search={search}
      />
    </div>
  )
}
