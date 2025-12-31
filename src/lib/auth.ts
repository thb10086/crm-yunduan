import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: '用户名', type: 'text' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('请输入用户名和密码')
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
          include: { department: true },
        })

        if (!user) {
          throw new Error('用户不存在')
        }

        if (!user.isActive) {
          throw new Error('账号已被禁用')
        }

        // 检查账号是否被锁定
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const remainingMinutes = Math.ceil(
            (user.lockedUntil.getTime() - Date.now()) / 60000
          )
          throw new Error(`账号已锁定，请${remainingMinutes}分钟后重试`)
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isPasswordValid) {
          // 增加登录失败次数
          const newAttempts = user.loginAttempts + 1
          const updateData: { loginAttempts: number; lockedUntil?: Date } = {
            loginAttempts: newAttempts,
          }

          // 3次失败后锁定5分钟
          if (newAttempts >= 3) {
            updateData.lockedUntil = new Date(Date.now() + 5 * 60 * 1000)
            updateData.loginAttempts = 0
          }

          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          })

          if (newAttempts >= 3) {
            throw new Error('密码错误次数过多，账号已锁定5分钟')
          }

          throw new Error(`密码错误，还剩${3 - newAttempts}次机会`)
        }

        // 登录成功，重置失败次数
        await prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: 0, lockedUntil: null },
        })

        // 记录登录日志
        await prisma.systemLog.create({
          data: {
            action: 'LOGIN',
            target: 'User',
            targetId: user.id,
            detail: '用户登录成功',
            userId: user.id,
          },
        })

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          departmentId: user.departmentId,
          departmentName: user.department?.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.departmentId = user.departmentId
        token.departmentName = user.departmentName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as 'ADMIN' | 'MANAGER' | 'SALES'
        session.user.departmentId = token.departmentId as string | undefined
        session.user.departmentName = token.departmentName as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
