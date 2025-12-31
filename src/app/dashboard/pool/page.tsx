import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { PoolList } from './pool-list'

async function getPoolCustomers(search?: string, page: number = 1) {
  const pageSize = 20
  const skip = (page - 1) * pageSize

  let where: Record<string, unknown> = { status: 'POOL' }

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
      orderBy: { updatedAt: 'desc' },
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

async function getTodayClaimCount(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const count = await prisma.claimRecord.count({
    where: {
      userId,
      claimedAt: { gte: today },
    },
  })
  
  const config = await prisma.systemConfig.findUnique({
    where: { key: 'daily_claim_limit' },
  })
  
  return {
    claimed: count,
    limit: parseInt(config?.value || '5'),
  }
}

interface SearchParams {
  search?: string
  page?: string
}

export default async function PoolPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user) return null

  const params = await searchParams
  const search = params.search || ''
  const page = parseInt(params.page || '1')

  const [data, claimInfo] = await Promise.all([
    getPoolCustomers(search, page),
    getTodayClaimCount(session.user.id),
  ])

  return (
    <div className="space-y-6">
      <PoolList
        customers={data.customers}
        total={data.total}
        currentPage={data.currentPage}
        totalPages={data.totalPages}
        search={search}
        claimInfo={claimInfo}
      />
    </div>
  )
}
