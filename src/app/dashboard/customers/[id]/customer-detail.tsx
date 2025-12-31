'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Building2,
  Clock,
  MessageSquare,
  FileText,
  Plus,
  Loader2,
  Undo2,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface FollowUp {
  id: string
  content: string
  type: string
  createdAt: Date
  nextFollowUpAt?: Date | null
  user: { id: string; name: string }
}

interface Payment {
  id: string
  amount: number
  paymentDate: Date
  remark?: string | null
}

interface Contract {
  id: string
  serialNumber: string
  amount: number
  signDate: Date
  status: string
  payments: Payment[]
}

interface Customer {
  id: string
  name: string
  contactPerson: string
  phone: string
  email?: string | null
  address?: string | null
  source?: string | null
  remark?: string | null
  createdAt: Date
  lastFollowUpAt?: Date | null
  owner?: { id: string; name: string } | null
  followUps: FollowUp[]
  contracts: Contract[]
}

interface CustomerDetailProps {
  customer: Customer
  userRole: string
  userId: string
}

const followUpTypeLabels: Record<string, string> = {
  PHONE: '电话',
  WECHAT: '微信',
  VISIT: '拜访',
  EMAIL: '邮件',
  OTHER: '其他',
}

const contractStatusLabels: Record<string, { label: string; color: string }> = {
  EXECUTING: { label: '执行中', color: 'bg-green-100 text-green-700' },
  DONE: { label: '已完成', color: 'bg-blue-100 text-blue-700' },
  TERMINATED: { label: '已终止', color: 'bg-gray-100 text-gray-700' },
}

export function CustomerDetail({ customer, userRole, userId }: CustomerDetailProps) {
  const router = useRouter()
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)
  const [isReturnOpen, setIsReturnOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [followUpData, setFollowUpData] = useState({
    content: '',
    type: 'PHONE',
    nextFollowUpAt: '',
  })
  const [returnReason, setReturnReason] = useState('')

  const isOwner = customer.owner?.id === userId

  const handleAddFollowUp = async () => {
    if (!followUpData.content.trim()) {
      toast.error('请输入跟进内容')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          content: followUpData.content,
          type: followUpData.type,
          nextFollowUpAt: followUpData.nextFollowUpAt || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '添加失败')
      }

      toast.success('跟进记录添加成功')
      setIsFollowUpOpen(false)
      setFollowUpData({ content: '', type: 'PHONE', nextFollowUpAt: '' })
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async () => {
    if (!returnReason.trim()) {
      toast.error('请填写退回原因')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/pool/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          reason: returnReason,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '退回失败')
      }

      toast.success('客户已退回公海')
      router.push('/dashboard/customers')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  // 计算合同回款情况
  const getContractPaymentInfo = (contract: Contract) => {
    const totalPaid = contract.payments.reduce((sum, p) => sum + p.amount, 0)
    const remaining = contract.amount - totalPaid
    const percentage = (totalPaid / contract.amount) * 100
    return { totalPaid, remaining, percentage }
  }

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/customers">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Button>
        </Link>
        <div className="flex gap-2">
          {isOwner && (
            <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl gap-2">
                  <Undo2 className="w-4 h-4" />
                  退回公海
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>退回公海</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>退回原因 *</Label>
                    <Textarea
                      placeholder="请填写退回原因"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="rounded-xl"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsReturnOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleReturn} disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      确认退回
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 客户信息卡片 */}
        <Card className="bg-white border-0 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-500" />
              客户信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{customer.name}</h2>
              {customer.source && (
                <Badge variant="secondary" className="mt-2">
                  {customer.source}
                </Badge>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{customer.contactPerson}</span>
                <span className="text-slate-800 font-medium">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{customer.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">
                  创建于 {format(customer.createdAt, 'yyyy/MM/dd', { locale: zhCN })}
                </span>
              </div>
            </div>

            {customer.remark && (
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500">备注</p>
                <p className="text-sm text-slate-700 mt-1">{customer.remark}</p>
              </div>
            )}

            {customer.owner && (
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500">负责人</p>
                <p className="text-sm text-slate-700 mt-1">{customer.owner.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 跟进记录时间轴 */}
        <Card className="bg-white border-0 shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              跟进记录
              <Badge variant="secondary">{customer.followUps.length}</Badge>
            </CardTitle>
            {isOwner && (
              <Dialog open={isFollowUpOpen} onOpenChange={setIsFollowUpOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    写跟进
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加跟进记录</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>跟进方式</Label>
                      <Select
                        value={followUpData.type}
                        onValueChange={(v) => setFollowUpData({ ...followUpData, type: v })}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PHONE">电话</SelectItem>
                          <SelectItem value="WECHAT">微信</SelectItem>
                          <SelectItem value="VISIT">拜访</SelectItem>
                          <SelectItem value="EMAIL">邮件</SelectItem>
                          <SelectItem value="OTHER">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>跟进内容 *</Label>
                      <Textarea
                        placeholder="请输入跟进内容"
                        value={followUpData.content}
                        onChange={(e) =>
                          setFollowUpData({ ...followUpData, content: e.target.value })
                        }
                        className="rounded-xl"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>下次跟进时间</Label>
                      <Input
                        type="date"
                        value={followUpData.nextFollowUpAt}
                        onChange={(e) =>
                          setFollowUpData({ ...followUpData, nextFollowUpAt: e.target.value })
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsFollowUpOpen(false)}>
                        取消
                      </Button>
                      <Button
                        onClick={handleAddFollowUp}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        保存
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {customer.followUps.length === 0 ? (
              <div className="text-center py-12 text-slate-500">暂无跟进记录</div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                <div className="space-y-4">
                  {customer.followUps.map((followUp, index) => (
                    <motion.div
                      key={followUp.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-10"
                    >
                      <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow" />
                      <div className="p-4 rounded-xl bg-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {followUpTypeLabels[followUp.type] || followUp.type}
                            </Badge>
                            <span className="text-sm text-slate-500">{followUp.user.name}</span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {format(followUp.createdAt, 'yyyy/MM/dd HH:mm', { locale: zhCN })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700">{followUp.content}</p>
                        {followUp.nextFollowUpAt && (
                          <p className="text-xs text-orange-600 mt-2">
                            下次跟进：{format(followUp.nextFollowUpAt, 'yyyy/MM/dd', { locale: zhCN })}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 合同信息 */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            合同记录
            <Badge variant="secondary">{customer.contracts.length}</Badge>
          </CardTitle>
          {isOwner && (
            <Link href={`/dashboard/contracts/new?customerId=${customer.id}`}>
              <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                新建合同
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {customer.contracts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">暂无合同记录</div>
          ) : (
            <div className="space-y-4">
              {customer.contracts.map((contract) => {
                const { totalPaid, remaining, percentage } = getContractPaymentInfo(contract)
                return (
                  <div
                    key={contract.id}
                    className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-800">
                          {contract.serialNumber}
                        </span>
                        <Badge
                          className={contractStatusLabels[contract.status]?.color}
                        >
                          {contractStatusLabels[contract.status]?.label}
                        </Badge>
                      </div>
                      <span className="text-lg font-bold text-slate-800">
                        ¥{contract.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                      <span>签约日期：{format(contract.signDate, 'yyyy/MM/dd')}</span>
                      <span>已回款：¥{totalPaid.toLocaleString()}</span>
                      <span>未回款：¥{remaining.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
