'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsFormProps {
  settings: Record<string, string>
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    pool_recycle_days: settings.pool_recycle_days || '15',
    daily_claim_limit: settings.daily_claim_limit || '5',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存失败')
      }

      toast.success('设置保存成功')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-500" />
            系统设置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-slate-800">公海池设置</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>自动回收天数</Label>
                  <Input
                    type="number"
                    value={formData.pool_recycle_days}
                    onChange={(e) =>
                      setFormData({ ...formData, pool_recycle_days: e.target.value })
                    }
                    className="rounded-xl"
                    min="1"
                    max="90"
                  />
                  <p className="text-xs text-slate-500">
                    客户超过此天数未跟进将自动回收至公海池
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>每日领取上限</Label>
                  <Input
                    type="number"
                    value={formData.daily_claim_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, daily_claim_limit: e.target.value })
                    }
                    className="rounded-xl"
                    min="1"
                    max="20"
                  />
                  <p className="text-xs text-slate-500">
                    每位销售每天最多可从公海池领取的客户数
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    保存设置
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
