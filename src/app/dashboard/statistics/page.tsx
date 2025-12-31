import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { StatisticsView } from './statistics-view'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

async function getStatistics() {
  const now = new Date()
  const currentMonthStart = startOfMonth(now)
  const currentMonthEnd = endOfMonth(now)

  // 获取最近6个月的数据
  const months = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    const monthEnd = endOfMonth(subMonths(now, i))
    months.push({ start: monthStart, end: monthEnd, label: format(monthStart, 'MM月') })
  }

  // 本月统计
  const [
    totalCustomers,
    monthlyCustomers,
    monthlyFollowups,
    monthlyContracts,
    totalAmount,
    salesRanking,
    monthlyData,
  ] = await Promise.all([
    prisma.customer.count({ where: { status: 'ASSIGNED' } }),
    prisma.customer.count({
      where: { createdAt: { gte: currentMonthStart, lte: currentMonthEnd } },
    }),
    prisma.followUp.count({
      where: { createdAt: { gte: currentMonthStart, lte: currentMonthEnd } },
    }),
    prisma.contract.aggregate({
      where: { signDate: { gte: currentMonthStart, lte: currentMonthEnd } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.contract.aggregate({
      _sum: { amount: true },
    }),
    // 销售排行
    prisma.contract.groupBy({
      by: ['customerId'],
      where: { signDate: { gte: currentMonthStart, lte: currentMonthEnd } },
      _sum: { amount: true },
    }).then(async (contracts) => {
      const customerIds = contracts.map((c) => c.customerId)
      const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        include: { owner: { select: { id: true, name: true } } },
      })
      
      const salesMap = new Map<string, { name: string; amount: number }>()
      contracts.forEach((c) => {
        const customer = customers.find((cu) => cu.id === c.customerId)
        if (customer?.owner) {
          const existing = salesMap.get(customer.owner.id)
          if (existing) {
            existing.amount += c._sum.amount || 0
          } else {
            salesMap.set(customer.owner.id, {
              name: customer.owner.name,
              amount: c._sum.amount || 0,
            })
          }
        }
      })
      
      return Array.from(salesMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
    }),
    // 月度趋势数据
    Promise.all(
      months.map(async (month) => {
        const [customers, contracts] = await Promise.all([
          prisma.customer.count({
            where: { createdAt: { gte: month.start, lte: month.end } },
          }),
          prisma.contract.aggregate({
            where: { signDate: { gte: month.start, lte: month.end } },
            _sum: { amount: true },
          }),
        ])
        return {
          month: month.label,
          customers,
          amount: contracts._sum.amount || 0,
        }
      })
    ),
  ])

  return {
    totalCustomers,
    monthlyCustomers,
    monthlyFollowups,
    monthlyContractsCount: monthlyContracts._count,
    monthlyContractsAmount: monthlyContracts._sum.amount || 0,
    totalAmount: totalAmount._sum.amount || 0,
    salesRanking,
    monthlyData,
  }
}

export default async function StatisticsPage() {
  const session = await auth()
  if (!session?.user) return null

  // 只有管理员和经理可以查看
  if (session.user.role === 'SALES') {
    redirect('/dashboard')
  }

  const stats = await getStatistics()

  return <StatisticsView stats={stats} />
}
