import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/vendas/[id] — Busca venda com itens.
 * DELETE /api/vendas/[id] — Cancela venda (status CANCELADA, devolve estoque).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: {
        itens: {
          include: { receita: true },
        },
      },
    })

    if (!venda) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 })
    }

    return NextResponse.json(venda)
  } catch (error) {
    console.error("[GET /api/vendas/[id]]", error)
    return NextResponse.json({ error: "Erro ao buscar venda" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const venda = await prisma.venda.findUnique({
      where: { id },
      include: { itens: true },
    })

    if (!venda) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 })
    }

    if (venda.status === "CANCELADA") {
      return NextResponse.json({ error: "Venda já está cancelada" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Cancela venda
      await tx.venda.update({
        where: { id },
        data: { status: "CANCELADA" },
      })

      // Remove registro financeiro relacionado
      await tx.financeiro.deleteMany({
        where: { referenciaId: id, referenciaTipo: "VENDA" },
      })
    })

    return NextResponse.json({ message: "Venda cancelada com sucesso" })
  } catch (error) {
    console.error("[DELETE /api/vendas/[id]]", error)
    return NextResponse.json({ error: "Erro ao cancelar venda" }, { status: 500 })
  }
}
