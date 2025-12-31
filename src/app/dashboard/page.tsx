import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'

async function getStats(userId: string, role: string, departmentId?: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // 根据角色构建查询条件
  const customerWhere = role === 'ADMIN' 
    ? {} 
    : role === 'MANAGER' && departmentId
      ? { owner: { departmentId } }
      : { ownerId: userId }

  const [
    totalCustomers,
    monthlyCustomers,
    totalContracts,
    monthlyAmount,
    pendingFollowups,
  ] = await Promise.all([
    // 总客户数
    prisma.customer.count({
      where: { ...customerWhere, status: 'ASSIGNED' },
    }),
    // 本月新增客户
    prisma.customer.count({
      where: {
        ...customerWhere,
        status: 'ASSIGNED',
        createdAt: { gte: startOfMonth },
      },
    }),
    // 总合同数
    prisma.contract.count({
      where: role === 'ADMIN' ? {} : { customer: customerWhere },
    }),
    // 本月合同金额
    prisma.contract.aggregate({
      where: {
        ...(role === 'ADMIN' ? {} : { customer: customerWhere }),
        signDate: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    // 待跟进数（今天或过期）
    prisma.followUp.count({
      where: {
        userId: role === 'ADMIN' ? undefined : userId,
        nextFollowUpAt: { lte: new Date() },
      },
    }),
  ])

  return {
    totalCustomers,
    monthlyCustomers,
    totalContracts,
    monthlyAmount: monthlyAmount._sum.amount || 0,
    pendingFollowups,
  }
}

async function getPendingFollowups(userId: string, role: string) {
  const followups = await prisma.followUp.findMany({
    where: {
      userId: role === 'ADMIN' ? undefined : userId,
      nextFollowUpAt: { lte: new Date() },
    },
    include: {
      customer: true,
    },
    orderBy: { nextFollowUpAt: 'asc' },
    take: 5,
  })
  return followups
}

async function getRecentCustomers(userId: string, role: string, departmentId?: string) {
  const where = role === 'ADMIN' 
    ? {} 
    : role === 'MANAGER' && departmentId
      ? { owner: { departmentId } }
      : { ownerId: userId }

  const customers = await prisma.customer.findMany({
    where: { ...where, status: 'ASSIGNED' },
    include: { owner: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  return customers
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) return null

  const { id: userId, role, departmentId } = session.user
  
  const [stats, pendingFollowups, recentCustomers] = await Promise.all([
    getStats(userId, role, departmentId),
    getPendingFollowups(userId, role),
    getRecentCustomers(userId, role, departmentId),
  ])

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">总客户数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">本月新增</p>
                <p className="text-2xl font-bold text-slate-800">{stats.monthlyCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">合同总数</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalContracts}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">本月业绩</p>
                <p className="text-2xl font-bold text-slate-800">
                  ¥{stats.monthlyAmount.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 待办和最近客户 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 待跟进提醒 */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              待跟进提醒
              {stats.pendingFollowups > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats.pendingFollowups}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingFollowups.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                暂无待跟进任务
              </div>
            ) : (
              <div className="space-y-3">
                {pendingFollowups.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/customers/${item.customerId}`}
                    className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{item.customer.name}</p>
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                          {item.content}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            item.nextFollowUpAt && item.nextFollowUpAt < new Date()
                              ? 'destructive'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {item.nextFollowUpAt
                            ? format(item.nextFollowUpAt, 'MM/dd', { locale: zhCN })
                            : '-'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近客户 */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              最近客户
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentCustomers.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                暂无客户数据
              </div>
            ) : (
              <div className="space-y-3">
                {recentCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/dashboard/customers/${customer.id}`}
                    className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{customer.name}</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {customer.contactPerson} · {customer.phone}
                        </p>
                      </div>
                      <div className="text-xs text-slate-400">
                        {format(customer.createdAt, 'MM/dd HH:mm', { locale: zhCN })}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 快速操作提示 */}
      {stats.pendingFollowups > 0 && (
        <Card className="bg-orange-50 border border-orange-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <p className="text-sm text-orange-800">
              您有 <span className="font-bold">{stats.pendingFollowups}</span> 个客户需要跟进，请及时处理！
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
