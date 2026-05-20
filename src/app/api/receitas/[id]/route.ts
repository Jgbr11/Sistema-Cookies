import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/receitas/[id] — Busca uma receita pelo ID com ingredientes e cálculo completo.
 * PUT /api/receitas/[id] — Atualiza receita (substitui todos os ingredientes).
 * DELETE /api/receitas/[id] — Exclui receita.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const receita = await prisma.receita.findUnique({
      where: { id },
      include: {
        ingredientes: {
          include: {
            ingrediente: {
              include: {
                compras: {
                  orderBy: { dataCompra: "desc" },
                  take: 3,
                },
              },
            },
          },
        },
        producoes: {
          orderBy: { dataFabricacao: "desc" },
          take: 5,
        },
        _count: { select: { producoes: true, vendaItens: true } },
      },
    })

    if (!receita) {
      return NextResponse.json({ error: "Receita não encontrada" }, { status: 404 })
    }

    return NextResponse.json(receita)
  } catch (error) {
    console.error("[GET /api/receitas/[id]]", error)
    return NextResponse.json({ error: "Erro ao buscar receita" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      nome,
      pesoFinal,
      qtdCookies,
      tempoPreparo,
      precoVenda,
      margemDesejada,
      observacoes,
      ativa,
      ingredientes,
    } = body

    // Atualiza receita e substitui ingredientes
    const receita = await prisma.$transaction(async (tx) => {
      // Remove ingredientes antigos
      await tx.receitaIngrediente.deleteMany({ where: { receitaId: id } })

      // Atualiza receita com novos ingredientes
      return tx.receita.update({
        where: { id },
        data: {
          nome,
          pesoFinal: pesoFinal ? Number(pesoFinal) : null,
          qtdCookies: Number(qtdCookies),
          tempoPreparo: tempoPreparo ? Number(tempoPreparo) : null,
          precoVenda: precoVenda ? Number(precoVenda) : null,
          margemDesejada: margemDesejada ? Number(margemDesejada) : null,
          observacoes: observacoes || null,
          ativa: ativa ?? true,
          ingredientes: {
            create:
              ingredientes?.map(
                (ing: { ingredienteId: string; quantidade: number; unidadeMedida: string }) => ({
                  ingredienteId: ing.ingredienteId,
                  quantidade: Number(ing.quantidade),
                  unidadeMedida: ing.unidadeMedida,
                })
              ) ?? [],
          },
        },
        include: {
          ingredientes: { include: { ingrediente: true } },
        },
      })
    })

    return NextResponse.json(receita)
  } catch (error) {
    console.error("[PUT /api/receitas/[id]]", error)
    return NextResponse.json({ error: "Erro ao atualizar receita" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.receita.delete({ where: { id } })
    return NextResponse.json({ message: "Receita excluída com sucesso" })
  } catch (error) {
    console.error("[DELETE /api/receitas/[id]]", error)
    return NextResponse.json({ error: "Erro ao excluir receita" }, { status: 500 })
  }
}
