import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar userRole={session.user.role} />
      
      <div className="ml-[256px] transition-all duration-200">
        <Header user={session.user} />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
