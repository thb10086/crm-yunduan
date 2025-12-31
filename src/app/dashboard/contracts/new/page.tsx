'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  contactPerson: string
}

export default function NewContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomerId = searchParams.get('customerId')

  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    customerId: preselectedCustomerId || '',
    amount: '',
    signDate: new Date().toISOString().split('T')[0],
    remark: '',
  })

  useEffect(() => {
    // 获取客户列表
    fetch('/api/customers?pageSize=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.customers) {
          setCustomers(data.customers)
        }
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerId) {
      toast.error('请选择客户')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('请输入有效的合同金额')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || '创建失败')
      }

      toast.success('合同创建成功')
      router.push('/dashboard/contracts')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/contracts">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Button>
        </Link>
      </div>

      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-500" />
            新建合同
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>关联客户 *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(v) => setFormData({ ...formData, customerId: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="请选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.contactPerson}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>合同金额 (元) *</Label>
                <Input
                  type="number"
                  placeholder="请输入合同金额"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="rounded-xl"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>签约日期 *</Label>
                <Input
                  type="date"
                  value={formData.signDate}
                  onChange={(e) => setFormData({ ...formData, signDate: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                placeholder="请输入备注信息"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/dashboard/contracts">
                <Button type="button" variant="outline" className="rounded-xl">
                  取消
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  '创建合同'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
