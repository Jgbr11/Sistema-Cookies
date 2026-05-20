import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

/**
 * GET /api/estoque — Retorna estoque de ingredientes e de produtos (cookies).
 */
export async function GET() {
  try {
    const [ingredientes, produtos] = await Promise.all([
      prisma.ingrediente.findMany({
        include: {
          fornecedor: { select: { id: true, nome: true } },
          compras: {
            orderBy: { dataCompra: "desc" },
            take: 1,
            select: { dataCompra: true, validade: true, precoPago: true, pesoComprado: true, quantidade: true },
          },
        },
        orderBy: { nome: "asc" },
      }),
      prisma.estoqueProduto.findMany({
        where: { quantidade: { gt: 0 } },
        include: {
          receita: { select: { id: true, nome: true, precoVenda: true } },
        },
        orderBy: [{ dataValidade: "asc" }, { createdAt: "desc" }],
      }),
    ])

    return NextResponse.json({ ingredientes, produtos })
  } catch (error) {
    console.error("[GET /api/estoque]", error)
    return NextResponse.json({ error: "Erro ao buscar estoque" }, { status: 500 })
  }
}
