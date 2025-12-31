import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始填充种子数据...')

  // 创建部门
  const salesDept = await prisma.department.upsert({
    where: { name: '销售一部' },
    update: {},
    create: { name: '销售一部' },
  })

  const salesDept2 = await prisma.department.upsert({
    where: { name: '销售二部' },
    update: {},
    create: { name: '销售二部' },
  })

  console.log('✅ 部门创建完成')

  // 创建管理员用户
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      name: '系统管理员',
      role: Role.ADMIN,
    },
  })

  // 创建销售经理
  const managerPassword = await bcrypt.hash('manager123', 10)
  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      passwordHash: managerPassword,
      name: '张经理',
      role: Role.MANAGER,
      departmentId: salesDept.id,
    },
  })

  // 创建普通销售
  const salesPassword = await bcrypt.hash('sales123', 10)
  const sales1 = await prisma.user.upsert({
    where: { username: 'sales1' },
    update: {},
    create: {
      username: 'sales1',
      passwordHash: salesPassword,
      name: '李销售',
      role: Role.SALES,
      departmentId: salesDept.id,
    },
  })

  const sales2 = await prisma.user.upsert({
    where: { username: 'sales2' },
    update: {},
    create: {
      username: 'sales2',
      passwordHash: salesPassword,
      name: '王销售',
      role: Role.SALES,
      departmentId: salesDept.id,
    },
  })

  console.log('✅ 用户创建完成')

  // 创建示例客户
  const customer1 = await prisma.customer.upsert({
    where: { id: 'demo-customer-1' },
    update: {},
    create: {
      id: 'demo-customer-1',
      name: '科技有限公司',
      contactPerson: '陈总',
      phone: '13800138001',
      email: 'chen@tech.com',
      address: '北京市朝阳区xxx街道',
      source: '官网咨询',
      ownerId: sales1.id,
      lastFollowUpAt: new Date(),
    },
  })

  const customer2 = await prisma.customer.upsert({
    where: { id: 'demo-customer-2' },
    update: {},
    create: {
      id: 'demo-customer-2',
      name: '贸易集团',
      contactPerson: '刘总',
      phone: '13800138002',
      email: 'liu@trade.com',
      address: '上海市浦东新区xxx路',
      source: '客户介绍',
      ownerId: sales1.id,
      lastFollowUpAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5天前
    },
  })

  // 公海池客户
  const poolCustomer = await prisma.customer.upsert({
    where: { id: 'demo-pool-customer' },
    update: {},
    create: {
      id: 'demo-pool-customer',
      name: '待领取公司',
      contactPerson: '孙经理',
      phone: '13800138003',
      source: '展会获取',
      status: 'POOL',
    },
  })

  console.log('✅ 客户创建完成')

  // 创建跟进记录
  await prisma.followUp.createMany({
    data: [
      {
        content: '首次电话沟通，客户对产品感兴趣',
        type: 'PHONE',
        customerId: customer1.id,
        userId: sales1.id,
        nextFollowUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        content: '发送产品资料，约定下周演示',
        type: 'WECHAT',
        customerId: customer1.id,
        userId: sales1.id,
      },
    ],
  })

  console.log('✅ 跟进记录创建完成')

  // 创建合同
  const contract = await prisma.contract.upsert({
    where: { serialNumber: 'CTR-20241201-001' },
    update: {},
    create: {
      serialNumber: 'CTR-20241201-001',
      amount: 50000,
      signDate: new Date('2024-12-01'),
      status: 'EXECUTING',
      customerId: customer1.id,
    },
  })

  // 创建回款记录
  await prisma.payment.create({
    data: {
      amount: 20000,
      paymentDate: new Date('2024-12-10'),
      remark: '首付款',
      contractId: contract.id,
    },
  })

  console.log('✅ 合同和回款记录创建完成')

  // 创建系统配置
  await prisma.systemConfig.upsert({
    where: { key: 'pool_recycle_days' },
    update: {},
    create: {
      key: 'pool_recycle_days',
      value: '15',
    },
  })

  await prisma.systemConfig.upsert({
    where: { key: 'daily_claim_limit' },
    update: {},
    create: {
      key: 'daily_claim_limit',
      value: '5',
    },
  })

  console.log('✅ 系统配置创建完成')

  console.log('🎉 种子数据填充完成！')
  console.log('')
  console.log('📋 测试账号:')
  console.log('  管理员: admin / admin123')
  console.log('  经理: manager / manager123')
  console.log('  销售: sales1 / sales123')
  console.log('  销售: sales2 / sales123')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
