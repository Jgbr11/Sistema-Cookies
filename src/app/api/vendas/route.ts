import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/vendas — Lista todas as vendas com itens.
 * POST /api/vendas — Cria nova venda:
 *   1. Cria venda com itens
 *   2. Desconta do estoque de produtos
 *   3. Registra movimentações
 *   4. Registra no financeiro (ENTRADA, VENDA)
 */
export async function GET() {
  try {
    const vendas = await prisma.venda.findMany({
      include: {
        itens: {
          include: {
            receita: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { dataVenda: "desc" },
    })

    return NextResponse.json(vendas)
  } catch (error) {
    console.error("[GET /api/vendas]", error)
    return NextResponse.json({ error: "Erro ao buscar vendas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dataVenda, desconto, formaPagamento, observacoes, itens } = body

    // itens: { receitaId, quantidade, precoUnitario }[]
    if (!formaPagamento || !itens?.length) {
      return NextResponse.json(
        { error: "formaPagamento e itens são obrigatórios" },
        { status: 400 }
      )
    }

    const totalBruto = itens.reduce(
      (sum: number, item: { quantidade: number; precoUnitario: number }) =>
        sum + item.quantidade * item.precoUnitario,
      0
    )
    const descontoVal = Number(desconto ?? 0)
    const total = totalBruto - descontoVal

    const venda = await prisma.$transaction(async (tx) => {
      // 1. Criar venda
      const novaVenda = await tx.venda.create({
        data: {
          dataVenda: dataVenda ? new Date(dataVenda) : new Date(),
          total,
          desconto: descontoVal,
          formaPagamento,
          observacoes: observacoes || null,
          status: "CONCLUIDA",
          itens: {
            create: itens.map(
              (item: { receitaId: string; quantidade: number; precoUnitario: number }) => ({
                receitaId: item.receitaId,
                quantidade: Number(item.quantidade),
                precoUnitario: Number(item.precoUnitario),
                subtotal: Number(item.quantidade) * Number(item.precoUnitario),
              })
            ),
          },
        },
        include: { itens: true },
      })

      // 2. Descontar do estoque de produtos (FIFO — pega os lotes mais antigos)
      for (const item of itens as { receitaId: string; quantidade: number; precoUnitario: number }[]) {
        let qtdRestante = Number(item.quantidade)

        const lotes = await tx.estoqueProduto.findMany({
          where: { receitaId: item.receitaId, quantidade: { gt: 0 } },
          orderBy: { createdAt: "asc" },
        })

        for (const lote of lotes) {
          if (qtdRestante <= 0) break

          const consumo = Math.min(lote.quantidade, qtdRestante)
          await tx.estoqueProduto.update({
            where: { id: lote.id },
            data: { quantidade: { decrement: consumo } },
          })

          await tx.movimentacaoEstoque.create({
            data: {
              tipo: "SAIDA",
              produtoId: lote.id,
              quantidade: consumo,
              motivo: "VENDA",
              referenciaId: novaVenda.id,
              data: novaVenda.dataVenda,
            },
          })

          qtdRestante -= consumo
        }
      }

      // 3. Registrar no financeiro
      await tx.financeiro.create({
        data: {
          tipo: "ENTRADA",
          categoria: "VENDA",
          descricao: `Venda #${novaVenda.id.slice(-8).toUpperCase()} — ${formaPagamento}`,
          valor: total,
          data: novaVenda.dataVenda,
          referenciaId: novaVenda.id,
          referenciaTipo: "VENDA",
        },
      })

      return novaVenda
    })

    return NextResponse.json(venda, { status: 201 })
  } catch (error) {
    console.error("[POST /api/vendas]", error)
    return NextResponse.json({ error: "Erro ao registrar venda" }, { status: 500 })
  }
}
