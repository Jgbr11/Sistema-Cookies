import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🍪 Iniciando seed do Sistema Cookies...")

  // Criar usuário admin padrão
  const senhaHash = await bcrypt.hash("admin123", 12)

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@cookies.com" },
    update: {},
    create: {
      email: "admin@cookies.com",
      nome: "Administrador",
      senhaHash,
    },
  })

  console.log(`✅ Usuário admin criado: ${admin.email}`)

  // Criar categorias de ingredientes como fornecedor exemplo
  const fornecedor = await prisma.fornecedor.upsert({
    where: { id: "fornecedor-padrao" },
    update: {},
    create: {
      id: "fornecedor-padrao",
      nome: "Fornecedor Padrão",
      contato: "contato@fornecedor.com",
      telefone: "(11) 99999-9999",
    },
  })

  console.log(`✅ Fornecedor exemplo criado: ${fornecedor.nome}`)

  console.log("🍪 Seed concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
