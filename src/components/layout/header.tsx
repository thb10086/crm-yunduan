'use client'

import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Bell, LogOut, User, ChevronRight } from 'lucide-react'

interface HeaderProps {
  user: {
    name?: string | null
    role?: string
    departmentName?: string
  }
}

const pathTitles: Record<string, string> = {
  '/dashboard': '工作台',
  '/dashboard/customers': '我的客户',
  '/dashboard/pool': '公海池',
  '/dashboard/followups': '跟进记录',
  '/dashboard/contracts': '合同管理',
  '/dashboard/statistics': '数据统计',
  '/dashboard/settings': '系统设置',
}

const roleNames: Record<string, string> = {
  ADMIN: '管理员',
  MANAGER: '销售经理',
  SALES: '销售',
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  
  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pathTitles)) {
      if (pathname === path || (path !== '/dashboard' && pathname.startsWith(path))) {
        return title
      }
    }
    return '工作台'
  }

  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean)
    const breadcrumbs: { title: string; href: string }[] = []
    
    let currentPath = ''
    for (const path of paths) {
      currentPath += `/${path}`
      if (pathTitles[currentPath]) {
        breadcrumbs.push({ title: pathTitles[currentPath], href: currentPath })
      }
    }
    
    return breadcrumbs
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      {/* 面包屑导航 */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold text-slate-800">{getPageTitle()}</h1>
        <div className="hidden md:flex items-center gap-1 ml-4 text-sm text-slate-500">
          {getBreadcrumbs().map((crumb, index) => (
            <span key={crumb.href} className="flex items-center">
              {index > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
              <span className={index === getBreadcrumbs().length - 1 ? 'text-slate-700' : ''}>
                {crumb.title}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-3">
        {/* 通知按钮 */}
        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700">
          <Bell className="w-5 h-5" />
        </Button>

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-3 h-10">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm font-medium">
                  {user.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-slate-700">{user.name}</div>
                <div className="text-xs text-slate-500">
                  {roleNames[user.role || ''] || user.role}
                  {user.departmentName && ` · ${user.departmentName}`}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" />
              个人资料
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
