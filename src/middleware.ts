import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user
  const isLoginPage = nextUrl.pathname === '/login'
  const isDashboard = nextUrl.pathname.startsWith('/dashboard')
  const isApiRoute = nextUrl.pathname.startsWith('/api')

  // API 路由不需要拦截
  if (isApiRoute) {
    return NextResponse.next()
  }

  // 未登录用户访问 dashboard，重定向到登录页
  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // 已登录用户访问登录页，重定向到 dashboard
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // 权限检查：普通销售不能访问 settings
  if (
    nextUrl.pathname.startsWith('/dashboard/settings') &&
    session?.user?.role !== 'ADMIN'
  ) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  // 权限检查：销售不能访问统计页面
  if (
    nextUrl.pathname.startsWith('/dashboard/statistics') &&
    session?.user?.role === 'SALES'
  ) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/captcha).*)'],
}
