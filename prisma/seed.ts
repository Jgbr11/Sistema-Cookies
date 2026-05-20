// @ts-nocheck
/**
 * Seed do banco de dados — cria usuário admin e dados de exemplo.
 * Execute: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...")

  // 1. Criar usuário administrador
  const senhaHash = await bcrypt.hash("admin123", 10)
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@cookies.com" },
    update: {},
    create: {
      email: "admin@cookies.com",
      senhaHash,
      nome: "Administrador",
    },
  })
  console.log("✅ Usuário admin criado:", admin.email)

  // 2. Criar fornecedores
  const fornecedor1 = await prisma.fornecedor.upsert({
    where: { id: "forn-001" },
    update: {},
    create: {
      id: "forn-001",
      nome: "Armazém do Trigo",
      contato: "contato@armazemtrigo.com",
      telefone: "(11) 99999-0001",
    },
  })

  const fornecedor2 = await prisma.fornecedor.upsert({
    where: { id: "forn-002" },
    update: {},
    create: {
      id: "forn-002",
      nome: "Distribuidora Doce Vida",
      contato: "docevida@distribuidora.com",
      telefone: "(11) 99999-0002",
    },
  })
  console.log("✅ Fornecedores criados")

  // 3. Criar ingredientes
  const farinha = await prisma.ingrediente.upsert({
    where: { id: "ing-001" },
    update: {},
    create: {
      id: "ing-001",
      nome: "Farinha de Trigo",
      unidadeMedida: "g",
      categoria: "Farinha",
      estoqueAtual: 5000,
      estoqueMinimo: 1000,
      fornecedorId: fornecedor1.id,
    },
  })

  const manteiga = await prisma.ingrediente.upsert({
    where: { id: "ing-002" },
    update: {},
    create: {
      id: "ing-002",
      nome: "Manteiga",
      unidadeMedida: "g",
      categoria: "Gordura",
      estoqueAtual: 1000,
      estoqueMinimo: 200,
      fornecedorId: fornecedor2.id,
    },
  })

  const acucar = await prisma.ingrediente.upsert({
    where: { id: "ing-003" },
    update: {},
    create: {
      id: "ing-003",
      nome: "Açúcar Cristal",
      unidadeMedida: "g",
      categoria: "Açúcar",
      estoqueAtual: 3000,
      estoqueMinimo: 500,
      fornecedorId: fornecedor1.id,
    },
  })

  const ovo = await prisma.ingrediente.upsert({
    where: { id: "ing-004" },
    update: {},
    create: {
      id: "ing-004",
      nome: "Ovo",
      unidadeMedida: "unidade",
      categoria: "Ovo",
      estoqueAtual: 30,
      estoqueMinimo: 10,
    },
  })

  const chocolate = await prisma.ingrediente.upsert({
    where: { id: "ing-005" },
    update: {},
    create: {
      id: "ing-005",
      nome: "Gotas de Chocolate",
      unidadeMedida: "g",
      categoria: "Chocolate",
      estoqueAtual: 2000,
      estoqueMinimo: 300,
      fornecedorId: fornecedor2.id,
    },
  })

  const nutella = await prisma.ingrediente.upsert({
    where: { id: "ing-006" },
    update: {},
    create: {
      id: "ing-006",
      nome: "Nutella",
      unidadeMedida: "g",
      categoria: "Chocolate",
      estoqueAtual: 1500,
      estoqueMinimo: 200,
      fornecedorId: fornecedor2.id,
    },
  })

  const fermento = await prisma.ingrediente.upsert({
    where: { id: "ing-007" },
    update: {},
    create: {
      id: "ing-007",
      nome: "Fermento em Pó",
      unidadeMedida: "g",
      categoria: "Fermento",
      estoqueAtual: 200,
      estoqueMinimo: 50,
    },
  })
  console.log("✅ Ingredientes criados")

  // 4. Registrar algumas compras de ingredientes
  await prisma.compraIngrediente.upsert({
    where: { id: "comp-001" },
    update: {},
    create: {
      id: "comp-001",
      ingredienteId: farinha.id,
      quantidade: 1,
      pesoComprado: 5000,
      precoPago: 20.87,
      dataCompra: new Date("2026-05-01"),
      validade: new Date("2026-11-01"),
      fornecedorId: fornecedor1.id,
    },
  })

  await prisma.compraIngrediente.upsert({
    where: { id: "comp-002" },
    update: {},
    create: {
      id: "comp-002",
      ingredienteId: manteiga.id,
      quantidade: 1,
      pesoComprado: 1000,
      precoPago: 32.50,
      dataCompra: new Date("2026-05-01"),
      validade: new Date("2026-06-15"),
      fornecedorId: fornecedor2.id,
    },
  })

  await prisma.compraIngrediente.upsert({
    where: { id: "comp-003" },
    update: {},
    create: {
      id: "comp-003",
      ingredienteId: chocolate.id,
      quantidade: 1,
      pesoComprado: 2000,
      precoPago: 45.00,
      dataCompra: new Date("2026-05-05"),
      validade: new Date("2026-12-01"),
      fornecedorId: fornecedor2.id,
    },
  })
  console.log("✅ Compras registradas")

  // 5. Criar receitas com ingredientes
  const receitaChocolate = await prisma.receita.upsert({
    where: { id: "rec-001" },
    update: {},
    create: {
      id: "rec-001",
      nome: "Cookie de Chocolate",
      qtdCookies: 24,
      pesoFinal: 800,
      tempoPreparo: 45,
      precoVenda: 7.50,
      margemDesejada: 0.45,
      observacoes: "Assar a 180°C por 12-15 minutos",
      ingredientes: {
        create: [
          { ingredienteId: farinha.id, quantidade: 510, unidadeMedida: "g" },
          { ingredienteId: manteiga.id, quantidade: 226, unidadeMedida: "g" },
          { ingredienteId: acucar.id, quantidade: 200, unidadeMedida: "g" },
          { ingredienteId: ovo.id, quantidade: 2, unidadeMedida: "unidade" },
          { ingredienteId: chocolate.id, quantidade: 300, unidadeMedida: "g" },
          { ingredienteId: fermento.id, quantidade: 5, unidadeMedida: "g" },
        ],
      },
    },
  })

  await prisma.receita.upsert({
    where: { id: "rec-002" },
    update: {},
    create: {
      id: "rec-002",
      nome: "Cookie de Nutella",
      qtdCookies: 20,
      pesoFinal: 700,
      tempoPreparo: 40,
      precoVenda: 9.00,
      margemDesejada: 0.50,
      observacoes: "Adicionar Nutella ao centro antes de assar",
      ingredientes: {
        create: [
          { ingredienteId: farinha.id, quantidade: 450, unidadeMedida: "g" },
          { ingredienteId: manteiga.id, quantidade: 200, unidadeMedida: "g" },
          { ingredienteId: acucar.id, quantidade: 150, unidadeMedida: "g" },
          { ingredienteId: ovo.id, quantidade: 2, unidadeMedida: "unidade" },
          { ingredienteId: nutella.id, quantidade: 300, unidadeMedida: "g" },
          { ingredienteId: fermento.id, quantidade: 4, unidadeMedida: "g" },
        ],
      },
    },
  })
  console.log("✅ Receitas criadas")

  // 6. Registrar produção de exemplo e estoque
  const hoje = new Date()
  const dataValidade = new Date(hoje)
  dataValidade.setDate(dataValidade.getDate() + 7)

  await prisma.producao.upsert({
    where: { lote: "LOT-20260520-0001" },
    update: {},
    create: {
      receitaId: receitaChocolate.id,
      qtdProduzida: 48,
      dataFabricacao: hoje,
      dataValidade,
      lote: "LOT-20260520-0001",
      responsavel: "Administrador",
      observacoes: "Lote de exemplo — seed inicial",
    },
  })

  await prisma.estoqueProduto.upsert({
    where: { id: "estq-001" },
    update: {},
    create: {
      id: "estq-001",
      receitaId: receitaChocolate.id,
      quantidade: 48,
      lote: "LOT-20260520-0001",
      dataValidade,
    },
  })
  console.log("✅ Produção e estoque de exemplo criados")

  // 7. Registrar lançamentos financeiros iniciais
  await prisma.financeiro.upsert({
    where: { id: "fin-001" },
    update: {},
    create: {
      id: "fin-001",
      tipo: "SAIDA",
      categoria: "INGREDIENTE",
      descricao: "Compra: Farinha de Trigo — Armazém do Trigo",
      valor: 20.87,
      data: new Date("2026-05-01"),
      referenciaId: "comp-001",
      referenciaTipo: "COMPRA",
    },
  })

  await prisma.financeiro.upsert({
    where: { id: "fin-002" },
    update: {},
    create: {
      id: "fin-002",
      tipo: "SAIDA",
      categoria: "INGREDIENTE",
      descricao: "Compra: Manteiga — Distribuidora Doce Vida",
      valor: 32.50,
      data: new Date("2026-05-01"),
      referenciaId: "comp-002",
      referenciaTipo: "COMPRA",
    },
  })
  console.log("✅ Lançamentos financeiros criados")

  console.log("")
  console.log("🎉 Seed concluído com sucesso!")
  console.log("")
  console.log("📋 Credenciais de acesso:")
  console.log("   Email: admin@cookies.com")
  console.log("   Senha: admin123")
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
