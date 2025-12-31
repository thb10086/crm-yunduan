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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Search,
  Plus,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Upload,
  Eye,
} from 'lucide-react'
import { CustomerForm } from './customer-form'

interface Customer {
  id: string
  name: string
  contactPerson: string
  phone: string
  email?: string | null
  source?: string | null
  createdAt: Date
  lastFollowUpAt?: Date | null
  owner?: { id: string; name: string } | null
  _count: { followUps: number; contracts: number }
}

interface CustomerListProps {
  customers: Customer[]
  total: number
  currentPage: number
  totalPages: number
  search: string
  userRole: string
}

export function CustomerList({
  customers,
  total,
  currentPage,
  totalPages,
  search,
  userRole,
}: CustomerListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) {
      params.set('search', searchValue)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    router.push(`/dashboard/customers?${params.toString()}`)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/dashboard/customers?${params.toString()}`)
  }

  return (
    <>
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="text-xl font-semibold text-slate-800">
              我的客户
              <span className="ml-2 text-sm font-normal text-slate-500">
                共 {total} 位
              </span>
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
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

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl">
                  <Upload className="w-4 h-4 mr-2" />
                  导入
                </Button>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                      <Plus className="w-4 h-4 mr-2" />
                      新增客户
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>新增客户</DialogTitle>
                    </DialogHeader>
                    <CustomerForm onSuccess={() => {
                      setIsAddOpen(false)
                      router.refresh()
                    }} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {customers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {search ? '未找到匹配的客户' : '暂无客户数据'}
            </div>
          ) : (
            <div className="space-y-3">
              {customers.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/dashboard/customers/${customer.id}`}>
                    <div className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 hover:shadow-sm transition-all duration-200 cursor-pointer group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
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
                            {customer.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" />
                                {customer.email}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            <span>跟进 {customer._count.followUps} 次</span>
                            <span>合同 {customer._count.contracts} 份</span>
                            {userRole !== 'SALES' && customer.owner && (
                              <span>负责人: {customer.owner.name}</span>
                            )}
                            <span>
                              创建于 {format(customer.createdAt, 'yyyy/MM/dd', { locale: zhCN })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {customer.lastFollowUpAt && (
                            <span className="text-xs text-slate-400">
                              最近跟进 {format(customer.lastFollowUpAt, 'MM/dd', { locale: zhCN })}
                            </span>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="w-4 h-4 text-slate-400" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
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
    </>
  )
}
