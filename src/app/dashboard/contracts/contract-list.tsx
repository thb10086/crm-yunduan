'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react'

interface Payment {
  id: string
  amount: number
  paymentDate: Date
}

interface Contract {
  id: string
  serialNumber: string
  amount: number
  signDate: Date
  status: string
  customer: { id: string; name: string; contactPerson: string }
  payments: Payment[]
}

interface ContractListProps {
  contracts: Contract[]
  total: number
  currentPage: number
  totalPages: number
  search: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  EXECUTING: { label: '执行中', color: 'bg-green-100 text-green-700' },
  DONE: { label: '已完成', color: 'bg-blue-100 text-blue-700' },
  TERMINATED: { label: '已终止', color: 'bg-gray-100 text-gray-700' },
}

export function ContractList({
  contracts,
  total,
  currentPage,
  totalPages,
  search,
}: ContractListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) {
      params.set('search', searchValue)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/dashboard/contracts?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/dashboard/contracts?${params.toString()}`)
  }

  const getPaymentInfo = (contract: Contract) => {
    const totalPaid = contract.payments.reduce((sum, p) => sum + p.amount, 0)
    const remaining = contract.amount - totalPaid
    const percentage = (totalPaid / contract.amount) * 100
    return { totalPaid, remaining, percentage }
  }

  return (
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-500" />
            合同管理
            <span className="ml-2 text-sm font-normal text-slate-500">
              共 {total} 份
            </span>
          </CardTitle>

          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="搜索合同编号/客户..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-9 w-64 bg-slate-50 border-slate-200 rounded-xl"
                />
              </div>
              <Button type="submit" variant="secondary" className="rounded-xl">
                搜索
              </Button>
            </form>

            <Link href="/dashboard/contracts/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                新建合同
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {search ? '未找到匹配的合同' : '暂无合同数据'}
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract, index) => {
              const { totalPaid, remaining, percentage } = getPaymentInfo(contract)
              return (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/dashboard/contracts/${contract.id}`}>
                    <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 hover:shadow-sm transition-all duration-200 cursor-pointer">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-800">
                              {contract.serialNumber}
                            </span>
                            <Badge className={statusLabels[contract.status]?.color}>
                              {statusLabels[contract.status]?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <Building2 className="w-3.5 h-3.5" />
                            {contract.customer.name} · {contract.customer.contactPerson}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-800">
                            ¥{contract.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-500">
                            签约：{format(contract.signDate, 'yyyy/MM/dd', { locale: zhCN })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                        <span>已回款：¥{totalPaid.toLocaleString()}</span>
                        <span>未回款：¥{remaining.toLocaleString()}</span>
                        <span>回款率：{percentage.toFixed(1)}%</span>
                      </div>
                      
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}

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
