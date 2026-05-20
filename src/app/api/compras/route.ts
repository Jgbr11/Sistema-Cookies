import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/compras — Lista histórico de compras de ingredientes.
 * POST /api/compras — Registra nova compra (transação atômica).
 */
export async function GET() {
  try {
    const compras = await prisma.compraIngrediente.findMany({
      include: {
        ingrediente: { select: { id: true, nome: true, unidadeMedida: true } },
        fornecedor: { select: { id: true, nome: true } },
      },
      orderBy: { dataCompra: "desc" },
    })

    return NextResponse.json(compras)
  } catch (error) {
    console.error("[GET /api/compras]", error)
    return NextResponse.json({ error: "Erro ao buscar compras" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ingredienteId, quantidade, pesoComprado, precoPago, dataCompra, validade, fornecedorId } = body

    if (!ingredienteId || !quantidade || !pesoComprado || !precoPago || !dataCompra) {
      return NextResponse.json(
        { error: "ingredienteId, quantidade, pesoComprado, precoPago e dataCompra são obrigatórios" },
        { status: 400 }
      )
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Registrar compra
      const compra = await tx.compraIngrediente.create({
        data: {
          ingredienteId,
          quantidade: Number(quantidade),
          pesoComprado: Number(pesoComprado),
          precoPago: Number(precoPago),
          dataCompra: new Date(dataCompra),
          validade: validade ? new Date(validade) : null,
          fornecedorId: fornecedorId || null,
        },
        include: {
          ingrediente: true,
          fornecedor: true,
        },
      })

      // 2. Incrementar estoque (peso total adicionado = pesoComprado * quantidade)
      const totalAdicionado = Number(pesoComprado) * Number(quantidade)
      await tx.ingrediente.update({
        where: { id: ingredienteId },
        data: { estoqueAtual: { increment: totalAdicionado } },
      })

      // 3. Registrar movimentação de estoque
      await tx.movimentacaoEstoque.create({
        data: {
          tipo: "ENTRADA",
          ingredienteId,
          quantidade: totalAdicionado,
          motivo: "COMPRA",
          referenciaId: compra.id,
          data: new Date(dataCompra),
        },
      })

      // 4. Registrar no financeiro como saída
      await tx.financeiro.create({
        data: {
          tipo: "SAIDA",
          categoria: "INGREDIENTE",
          descricao: `Compra: ${compra.ingrediente.nome}${compra.fornecedor ? ` — ${compra.fornecedor.nome}` : ""}`,
          valor: Number(precoPago),
          data: new Date(dataCompra),
          referenciaId: compra.id,
          referenciaTipo: "COMPRA",
        },
      })

      return compra
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    console.error("[POST /api/compras]", error)
    return NextResponse.json({ error: "Erro ao registrar compra" }, { status: 500 })
  }
}
