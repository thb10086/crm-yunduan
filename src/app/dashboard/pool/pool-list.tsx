'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Phone,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Waves,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  contactPerson: string
  phone: string
  source?: string | null
  returnReason?: string | null
  updatedAt: Date
}

interface PoolListProps {
  customers: Customer[]
  total: number
  currentPage: number
  totalPages: number
  search: string
  claimInfo: { claimed: number; limit: number }
}

export function PoolList({
  customers,
  total,
  currentPage,
  totalPages,
  search,
  claimInfo,
}: PoolListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search)
  const [claiming, setClaiming] = useState<string | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) {
      params.set('search', searchValue)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/dashboard/pool?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/dashboard/pool?${params.toString()}`)
  }

  const handleClaim = async (customerId: string) => {
    if (claimInfo.claimed >= claimInfo.limit) {
      toast.error(`今日领取已达上限 (${claimInfo.limit}个)`)
      return
    }

    setClaiming(customerId)
    try {
      const res = await fetch('/api/pool/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || '领取失败')
      }

      toast.success('领取成功！')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '领取失败')
    } finally {
      setClaiming(null)
    }
  }

  const canClaim = claimInfo.claimed < claimInfo.limit

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Waves className="w-6 h-6 text-blue-500" />
              公海池
              <span className="ml-2 text-sm font-normal text-slate-500">
                共 {total} 位客户
              </span>
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              今日已领取 {claimInfo.claimed} / {claimInfo.limit} 个
            </p>
          </div>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索客户名称/电话..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-9 w-64 bg-slate-50 border-slate-200 rounded-xl"
              />
            </div>
            <Button type="submit" variant="secondary" className="rounded-xl">
              搜索
            </Button>
          </form>
        </div>
      </CardHeader>

      <CardContent>
        {customers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {search ? '未找到匹配的客户' : '公海池暂无客户'}
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-800">
                        {customer.name}
                      </h3>
                      {customer.source && (
                        <Badge variant="secondary" className="text-xs">
                          {customer.source}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {customer.contactPerson} · {customer.phone}
                      </span>
                    </div>
                    {customer.returnReason && (
                      <p className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                        退回原因：{customer.returnReason}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-slate-400">
                      进入公海时间：{format(customer.updatedAt, 'yyyy/MM/dd HH:mm', { locale: zhCN })}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleClaim(customer.id)}
                    disabled={!canClaim || claiming === customer.id}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl"
                  >
                    {claiming === customer.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        领取中...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        领取客户
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-xl"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600 px-4">
              第 {currentPage} / {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-xl"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
