import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/fornecedores — list all fornecedores
export async function GET() {
  try {
    const fornecedores = await prisma.fornecedor.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: { ingredientes: true, compras: true },
        },
      },
    });

    return NextResponse.json(fornecedores);
  } catch (error) {
    console.error("[GET /api/fornecedores]", error);
    return NextResponse.json(
      { error: "Erro ao buscar fornecedores" },
      { status: 500 }
    );
  }
}

// POST /api/fornecedores — create a new fornecedor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, contato, telefone } = body as {
      nome: string;
      contato?: string;
      telefone?: string;
    };

    if (!nome) {
      return NextResponse.json(
        { error: "Campo obrigatório: nome" },
        { status: 400 }
      );
    }

    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome,
        contato: contato ?? null,
        telefone: telefone ?? null,
      },
    });

    return NextResponse.json(fornecedor, { status: 201 });
  } catch (error) {
    console.error("[POST /api/fornecedores]", error);
    return NextResponse.json(
      { error: "Erro ao criar fornecedor" },
      { status: 500 }
    );
  }
}
