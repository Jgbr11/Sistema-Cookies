import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/ingredientes — list all ingredientes with fornecedor, last purchase, estoqueAtual
export async function GET() {
  try {
    const ingredientes = await prisma.ingrediente.findMany({
      include: {
        fornecedor: true,
        compras: {
          orderBy: { dataCompra: "desc" },
          // sem take: 1 — precisamos de todas as compras para custo médio correto
        },
      },
      orderBy: { nome: "asc" },
    })

    const result = ingredientes.map((ing) => ({
      id: ing.id,
      nome: ing.nome,
      unidadeMedida: ing.unidadeMedida,
      categoria: ing.categoria,
      estoqueAtual: ing.estoqueAtual,
      estoqueMinimo: ing.estoqueMinimo,
      fornecedor: ing.fornecedor,
      compras: ing.compras,              // array com últimas compras para custo médio
      ultimaCompra: ing.compras[0] ?? null,
      createdAt: ing.createdAt,
      updatedAt: ing.updatedAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("[GET /api/ingredientes]", error);
    return NextResponse.json(
      { error: "Erro ao buscar ingredientes" },
      { status: 500 }
    );
  }
}

// POST /api/ingredientes — create a new ingrediente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, unidadeMedida, categoria, estoqueMinimo, fornecedorId } =
      body as {
        nome: string;
        unidadeMedida: string;
        categoria: string;
        estoqueMinimo?: number;
        fornecedorId?: string;
      };

    if (!nome || !unidadeMedida || !categoria) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, unidadeMedida, categoria" },
        { status: 400 }
      );
    }

    const ingrediente = await prisma.ingrediente.create({
      data: {
        nome,
        unidadeMedida,
        categoria,
        estoqueMinimo: estoqueMinimo ?? 0,
        ...(fornecedorId ? { fornecedorId } : {}),
      },
      include: { fornecedor: true },
    });

    return NextResponse.json(ingrediente, { status: 201 });
  } catch (error) {
    console.error("[POST /api/ingredientes]", error);
    return NextResponse.json(
      { error: "Erro ao criar ingrediente" },
      { status: 500 }
    );
  }
}
