import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const adminHash = await bcrypt.hash('Admin@2026', 12)
  const demoHash = await bcrypt.hash('Demo@2026', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ebrconsultoria.com.br' },
    update: {},
    create: {
      name: 'Administrador EBR',
      email: 'admin@ebrconsultoria.com.br',
      passwordHash: adminHash,
      role: 'ADMIN',
      plan: 'ENTERPRISE',
      organization: 'EBR Consultoria',
      emailVerified: true,
      isActive: true,
    },
  })

  const demo = await prisma.user.upsert({
    where: { email: 'demo@ebrconsultoria.com.br' },
    update: {},
    create: {
      name: 'Analista Demo',
      email: 'demo@ebrconsultoria.com.br',
      passwordHash: demoHash,
      role: 'ANALYST',
      plan: 'PROFESSIONAL',
      organization: 'Prefeitura Municipal Demo',
      emailVerified: true,
      isActive: true,
    },
  })

  // Decision cases
  const case1 = await prisma.decisionCase.upsert({
    where: { id: 'seed-case-1' },
    update: {},
    create: {
      id: 'seed-case-1',
      userId: demo.id,
      title: 'Contratação de Sistema de Gestão Municipal',
      institution: 'Prefeitura Municipal Demo',
      sector: 'TI',
      classification: 'STRATEGIC',
      status: 'IN_PROGRESS',
    },
  })

  await prisma.f1Problem.upsert({
    where: { caseId: case1.id },
    update: {},
    create: {
      caseId: case1.id,
      decisionDate: new Date('2026-06-30'),
      deadline: '30/06/2026',
      decider: 'Prefeito Municipal',
      advisor: 'Diretor de TI',
      decisionType: ['Estratégica', 'Não rotineira'],
      whatDecision: 'Contratar sistema ERP para gestão municipal integrada.',
      context: 'A prefeitura utiliza sistemas legados fragmentados que causam retrabalho e erros.',
      errorImpact: 'Manutenção de ineficiências, risco de auditoria e perda de dados.',
      constraints: 'Orçamento máximo de R$ 500.000,00. Prazo de implantação 12 meses.',
      effortLevel: 'Alto',
    },
  })

  const case2 = await prisma.decisionCase.upsert({
    where: { id: 'seed-case-2' },
    update: {},
    create: {
      id: 'seed-case-2',
      userId: demo.id,
      title: 'Reforma da Escola Municipal Centro',
      institution: 'Secretaria de Educação',
      sector: 'Educação',
      classification: 'OPERATIONAL',
      status: 'DECIDED',
    },
  })

  const case3 = await prisma.decisionCase.upsert({
    where: { id: 'seed-case-3' },
    update: {},
    create: {
      id: 'seed-case-3',
      userId: demo.id,
      title: 'Implementação de Programa de Coleta Seletiva',
      institution: 'Secretaria de Meio Ambiente',
      sector: 'Meio Ambiente',
      classification: 'TACTICAL',
      status: 'CLOSED',
      closedAt: new Date(),
    },
  })

  // Alerts
  const alertKeywords = [
    { name: 'Software e Sistemas', keywords: ['software', 'sistema', 'tecnologia'] },
    { name: 'Obras Civis', keywords: ['obra', 'construção', 'reforma'] },
    { name: 'Saúde Pública', keywords: ['saúde', 'medicamento', 'hospital'] },
    { name: 'Educação', keywords: ['escola', 'ensino', 'educação'] },
    { name: 'Consultoria', keywords: ['consultoria', 'assessoria'] },
  ]

  for (const alertData of alertKeywords) {
    await prisma.alert.upsert({
      where: { id: `seed-alert-${alertData.name}` },
      update: {},
      create: {
        id: `seed-alert-${alertData.name}`,
        userId: demo.id,
        name: alertData.name,
        keywords: alertData.keywords,
        states: ['SC', 'PR', 'RS'],
        isActive: true,
      },
    })
  }

  console.log('Seed completed!')
  console.log(`Admin: admin@ebrconsultoria.com.br / Admin@2026`)
  console.log(`Demo:  demo@ebrconsultoria.com.br / Demo@2026`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
