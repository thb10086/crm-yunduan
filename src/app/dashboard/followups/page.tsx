import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ClipboardList, Phone, MessageSquare, Users, Mail, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

const typeIcons: Record<string, React.ElementType> = {
  PHONE: Phone,
  WECHAT: MessageSquare,
  VISIT: Users,
  EMAIL: Mail,
  OTHER: MoreHorizontal,
}

const typeLabels: Record<string, string> = {
  PHONE: '电话',
  WECHAT: '微信',
  VISIT: '拜访',
  EMAIL: '邮件',
  OTHER: '其他',
}

async function getFollowups(userId: string, role: string, departmentId?: string) {
  let where: Record<string, unknown> = {}
  
  if (role === 'SALES') {
    where.userId = userId
  } else if (role === 'MANAGER' && departmentId) {
    where.user = { departmentId }
  }

  const followups = await prisma.followUp.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, contactPerson: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return followups
}

export default async function FollowupsPage() {
  const session = await auth()
  if (!session?.user) return null

  const { id: userId, role, departmentId } = session.user
  const followups = await getFollowups(userId, role, departmentId)

  return (
    <div className="space-y-6">
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-green-500" />
            跟进记录
            <span className="ml-2 text-sm font-normal text-slate-500">
              最近 50 条
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {followups.length === 0 ? (
            <div className="text-center py-12 text-slate-500">暂无跟进记录</div>
          ) : (
            <div className="space-y-3">
              {followups.map((followup) => {
                const Icon = typeIcons[followup.type] || MoreHorizontal
                return (
                  <Link
                    key={followup.id}
                    href={`/dashboard/customers/${followup.customerId}`}
                    className="block"
                  >
                    <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-800">
                                {followup.customer.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {typeLabels[followup.type]}
                              </Badge>
                            </div>
                            <span className="text-xs text-slate-400">
                              {format(followup.createdAt, 'MM/dd HH:mm', { locale: zhCN })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {followup.content}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span>联系人：{followup.customer.contactPerson}</span>
                            {role !== 'SALES' && <span>跟进人：{followup.user.name}</span>}
                            {followup.nextFollowUpAt && (
                              <span className="text-orange-600">
                                下次跟进：{format(followup.nextFollowUpAt, 'MM/dd', { locale: zhCN })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
