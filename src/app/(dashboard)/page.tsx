"use client"

import { useEffect, useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Factory,
  DollarSign,
  AlertTriangle,
  Package,
  Clock,
  Cookie,
  BarChart3,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface DashboardData {
  vendasHoje: { total: number; quantidade: number }
  vendasMes: { total: number; quantidade: number; variacaoMensal: number }
  producaoHoje: { total: number; lotes: number }
  lucroEstimado: number
  custosMes: number
  margemLucro: number
  alertas: {
    estoqueBaixo: { id: string; nome: string; estoqueAtual: number; estoqueMinimo: number; unidadeMedida: string }[]
    produtosVencendo: { id: string; receita: { nome: string }; quantidade: number; dataValidade: string; lote: string }[]
    ingredientesVencendo: { id: string; ingrediente: { nome: string }; validade: string; quantidade: number }[]
  }
  topProdutos: {
    receitaId: string
    receita: { nome: string; precoVenda: number | null } | undefined
    _sum: { quantidade: number | null; subtotal: number | null }
  }[]
  vendasPorPagamento: { formaPagamento: string; _sum: { total: number | null }; _count: { id: number } }[]
}

const PAYMENT_COLORS: Record<string, string> = {
  PIX: "#22c55e",
  CREDITO: "#0a0a50",
  DEBITO: "#644536",
  DINHEIRO: "#8b6f47",
}

const PAYMENT_LABELS: Record<string, string> = {
  PIX: "Pix",
  CREDITO: "Crédito",
  DEBITO: "Débito",
  DINHEIRO: "Dinheiro",
}

/**
 * Dashboard principal — métricas do sistema de cookies.
 * Carrega dados da API /api/dashboard.
 */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Cookie className="w-10 h-10 text-[#644536] animate-bounce" />
          <p className="text-muted-foreground text-sm">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  const variacao = data?.vendasMes.variacaoMensal ?? 0
  const isPositive = variacao >= 0

  // Dados para o gráfico de pagamentos
  const pieData = (data?.vendasPorPagamento ?? []).map((item) => ({
    name: PAYMENT_LABELS[item.formaPagamento] ?? item.formaPagamento,
    value: item._sum.total ?? 0,
    color: PAYMENT_COLORS[item.formaPagamento] ?? "#6b6b7b",
  }))

  // Dados para o gráfico de top produtos
  const barData = (data?.topProdutos ?? []).map((tp) => ({
    name: tp.receita?.nome?.split(" ").slice(0, 2).join(" ") ?? "—",
    quantidade: tp._sum.quantidade ?? 0,
    faturamento: tp._sum.subtotal ?? 0,
  }))

  const totalAlertas =
    (data?.alertas.estoqueBaixo.length ?? 0) +
    (data?.alertas.produtosVencendo.length ?? 0) +
    (data?.alertas.ingredientesVencendo.length ?? 0)

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendas hoje */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vendas Hoje
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-[#0a0a50]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0a0a50]">
              {formatCurrency(data?.vendasHoje.total ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.vendasHoje.quantidade ?? 0} pedido(s)
            </p>
          </CardContent>
        </Card>

        {/* Faturamento mensal */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento Mensal
            </CardTitle>
            <DollarSign className="w-4 h-4 text-[#22c55e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0a0a50]">
              {formatCurrency(data?.vendasMes.total ?? 0)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {isPositive ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={`text-xs ${isPositive ? "text-green-600" : "text-red-500"}`}>
                {isPositive ? "+" : ""}{variacao.toFixed(1)}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Lucro estimado */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro Estimado
            </CardTitle>
            <BarChart3 className="w-4 h-4 text-[#644536]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0a0a50]">
              {formatCurrency(data?.lucroEstimado ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margem: {(data?.margemLucro ?? 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        {/* Produção hoje */}
        <Card className="col-span-1">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produção Hoje
            </CardTitle>
            <Factory className="w-4 h-4 text-[#8b6f47]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#0a0a50]">
              {data?.producaoHoje.total ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              cookies em {data?.producaoHoje.lotes ?? 0} lote(s)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top produtos */}
        {barData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cookie className="w-4 h-4 text-[#644536]" />
                Top Produtos do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => [Number(value), "Unidades"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar dataKey="quantidade" fill="#0a0a50" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Vendas por pagamento */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#644536]" />
                Formas de Pagamento (Mês)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Placeholder quando não há dados de gráficos */}
        {barData.length === 0 && pieData.length === 0 && (
          <Card className="lg:col-span-2">
            <CardContent className="flex flex-col items-center justify-center h-48 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                Registre vendas para ver os gráficos aqui
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alertas */}
      {totalAlertas > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-warning-foreground">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Alertas ({totalAlertas})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estoque baixo */}
            {data?.alertas.estoqueBaixo && data.alertas.estoqueBaixo.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  Estoque Baixo ({data.alertas.estoqueBaixo.length})
                </p>
                <div className="space-y-1">
                  {data.alertas.estoqueBaixo.map((ing) => (
                    <div key={ing.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{ing.nome}</span>
                      <Badge variant="destructive" className="text-xs">
                        {ing.estoqueAtual}{ing.unidadeMedida} / mín {ing.estoqueMinimo}{ing.unidadeMedida}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Produtos vencendo */}
            {data?.alertas.produtosVencendo && data.alertas.produtosVencendo.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Cookies Vencendo em 3 dias ({data.alertas.produtosVencendo.length})
                </p>
                <div className="space-y-1">
                  {data.alertas.produtosVencendo.map((prod) => (
                    <div key={prod.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{prod.receita.nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">Lote: {prod.lote}</span>
                        <Badge variant="outline" className="text-xs border-warning text-warning-foreground">
                          {formatDate(prod.dataValidade)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredientes vencendo */}
            {data?.alertas.ingredientesVencendo && data.alertas.ingredientesVencendo.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Ingredientes Vencendo em 7 dias ({data.alertas.ingredientesVencendo.length})
                </p>
                <div className="space-y-1">
                  {data.alertas.ingredientesVencendo.map((comp) => (
                    <div key={comp.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{comp.ingrediente.nome}</span>
                      <Badge variant="outline" className="text-xs border-warning text-warning-foreground">
                        {formatDate(comp.validade)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estado vazio geral */}
      {!data && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 text-center">
            <Cookie className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              Nenhum dado disponível ainda. Comece cadastrando ingredientes e receitas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
