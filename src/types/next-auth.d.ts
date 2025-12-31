import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    name: string
    username: string
    role: 'ADMIN' | 'MANAGER' | 'SALES'
    departmentId?: string | null
    departmentName?: string | null
  }

  interface Session {
    user: {
      id: string
      name: string
      username: string
      role: 'ADMIN' | 'MANAGER' | 'SALES'
      departmentId?: string
      departmentName?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    role: string
    departmentId?: string
    departmentName?: string
  }
}
