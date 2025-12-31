'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

const customerSchema = z.object({
  name: z.string().min(1, '请输入公司名称'),
  contactPerson: z.string().min(1, '请输入联系人'),
  phone: z.string().min(1, '请输入电话').regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  email: z.string().email('请输入正确的邮箱').optional().or(z.literal('')),
  address: z.string().optional(),
  source: z.string().optional(),
  remark: z.string().optional(),
})

type CustomerFormData = z.infer<typeof customerSchema>

interface CustomerFormProps {
  onSuccess: () => void
  initialData?: CustomerFormData
}

export function CustomerForm({ onSuccess, initialData }: CustomerFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      source: '',
      remark: '',
    },
  })

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || '创建失败')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">公司名称 *</Label>
          <Input
            id="name"
            placeholder="请输入公司名称"
            {...register('name')}
            className="rounded-xl"
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactPerson">联系人 *</Label>
          <Input
            id="contactPerson"
            placeholder="请输入联系人"
            {...register('contactPerson')}
            className="rounded-xl"
          />
          {errors.contactPerson && (
            <p className="text-sm text-red-500">{errors.contactPerson.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">手机号 *</Label>
          <Input
            id="phone"
            placeholder="请输入手机号"
            {...register('phone')}
            className="rounded-xl"
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            placeholder="请输入邮箱"
            {...register('email')}
            className="rounded-xl"
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">地址</Label>
        <Input
          id="address"
          placeholder="请输入地址"
          {...register('address')}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="source">客户来源</Label>
        <Input
          id="source"
          placeholder="如：官网咨询、客户介绍、展会获取等"
          {...register('source')}
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="remark">备注</Label>
        <Textarea
          id="remark"
          placeholder="请输入备注信息"
          {...register('remark')}
          className="rounded-xl resize-none"
          rows={3}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            '保存'
          )}
        </Button>
      </div>
    </form>
  )
}
