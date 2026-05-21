"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, TrendingUp, TrendingDown, DollarSign, Search, Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { formatCurrency, formatDate } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

interface Lancamento {
  id: string
  tipo: string
  categoria: string
  descricao: string
  valor: number
  data: string
  referenciaId: string | null
  referenciaTipo: string | null
}

interface FinanceiroData {
  lancamentos: Lancamento[]
  resumo: {
    totalEntradas: number
    totalSaidas: number
    saldo: number
  }
}

const CATEGORIAS_ENTRADA = ["VENDA", "OUTROS"]
const CATEGORIAS_SAIDA = [
  "INGREDIENTE", "EMBALAGEM", "GAS", "ENERGIA",
  "FUNCIONARIO", "TAXA", "OUTROS",
]

const CATEGORIA_LABELS: Record<string, string> = {
  VENDA: "Venda",
  INGREDIENTE: "Ingrediente",
  EMBALAGEM: "Embalagem",
  GAS: "Gás",
  ENERGIA: "Energia",
  FUNCIONARIO: "Funcionário",
  TAXA: "Taxa",
  OUTROS: "Outros",
}

function LancamentoForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    tipo: "SAIDA",
    categoria: "",
    descricao: "",
    valor: "",
    data: new Date().toISOString().split("T")[0],
  })
  const [saving, setSaving] = useState(false)

  const categorias = form.tipo === "ENTRADA" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/financeiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, valor: Number(form.valor) }),
      })
      if (!res.ok) throw new Error()
      toast.success("Lançamento registrado!")
      onSave()
    } catch {
      toast.error("Erro ao registrar lançamento")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="tipo-lanc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo</Label>
          <Select
            value={form.tipo}
            onValueChange={(v) => setForm({ ...form, tipo: v || "SAIDA", categoria: "" })}
          >
            <SelectTrigger id="tipo-lanc">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ENTRADA">Entrada</SelectItem>
              <SelectItem value="SAIDA">Saída</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="categoria-lanc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria</Label>
          <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v || "" })}>
            <SelectTrigger id="categoria-lanc">
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>{CATEGORIA_LABELS[cat]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="desc-lanc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</Label>
          <Input
            id="desc-lanc"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            required
            placeholder="Ex: Gás de cozinha"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="valor-lanc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor (R$)</Label>
          <Input
            id="valor-lanc"
            type="number"
            min="0"
            step="0.01"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="data-lanc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</Label>
          <Input
            id="data-lanc"
            type="date"
            value={form.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-3">
        <Button type="button" variant="outline" onClick={onCancel} id="lanc-cancel">Cancelar</Button>
        <Button type="submit" disabled={saving} id="lanc-save">
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  )
}

/**
 * Página Financeiro.
 * Fluxo de caixa, DRE simplificado e gráficos mensais.
 */
export default function FinanceiroPage() {
  const [data, setData] = useState<FinanceiroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(new Date().toISOString().substring(0, 7))
  const [busca, setBusca] = useState("")
  const [dialogo, setDialogo] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/financeiro?mes=${mes}`)
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [mes])

  useEffect(() => { carregar() }, [carregar])

  const lancamentos = data?.lancamentos ?? []
  const filtrados = lancamentos.filter(
    (l) =>
      l.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      CATEGORIA_LABELS[l.categoria]?.toLowerCase().includes(busca.toLowerCase())
  )

  // Dados para o gráfico de barras por categoria (saídas)
  const saidas = lancamentos.filter((l) => l.tipo === "SAIDA")
  const saidasPorCategoria = Object.entries(
    saidas.reduce<Record<string, number>>((acc, l) => {
      acc[l.categoria] = (acc[l.categoria] ?? 0) + l.valor
      return acc
    }, {})
  ).map(([cat, valor]) => ({ name: CATEGORIA_LABELS[cat] ?? cat, valor }))
    .sort((a, b) => b.valor - a.valor)

  return (
    <div className="space-y-6">
      {/* Filtro de mês */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Label htmlFor="mes-fin" className="text-sm text-muted-foreground whitespace-nowrap font-medium">Período:</Label>
          <Input
            id="mes-fin"
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="w-auto"
          />
        </div>
        <Button
          id="btn-novo-lancamento"
          onClick={() => setDialogo(true)}
          className="flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      {/* Cards de resumo */}
      {!loading && data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover-lift bg-gradient-to-br from-emerald-50 to-green-50/50 border-emerald-200/50">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-emerald-700">Entradas</CardTitle>
              <div className="icon-circle-sm bg-emerald-100">
                <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-emerald-700">
                  {formatCurrency(data.resumo.totalEntradas)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift bg-gradient-to-br from-red-50 to-rose-50/50 border-red-200/50">
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-red-700">Saídas</CardTitle>
              <div className="icon-circle-sm bg-red-100">
                <ArrowDownCircle className="w-4 h-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-red-700">
                  {formatCurrency(data.resumo.totalSaidas)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className={`hover-lift ${data.resumo.saldo >= 0 ? "bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-primary/15" : "bg-gradient-to-br from-red-50 to-rose-50/50 border-red-200/50"}`}>
            <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold text-primary">Saldo</CardTitle>
              <div className="icon-circle-sm bg-primary/10">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-extrabold ${data.resumo.saldo >= 0 ? "text-primary" : "text-red-600"}`}>
                  {formatCurrency(data.resumo.saldo)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico de saídas por categoria */}
      {saidasPorCategoria.length > 0 && (
        <Card className="hover-lift">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2.5">
              <div className="icon-circle-sm bg-accent/10">
                <TrendingDown className="w-4 h-4 text-accent" />
              </div>
              Saídas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={saidasPorCategoria} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v)), "Total"]}
                  contentStyle={{ fontSize: 12, borderRadius: 16, border: 'none', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="valor" fill="#644536" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista de lançamentos */}
      <Tabs defaultValue="todos">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="todos" id="tab-todos">Todos</TabsTrigger>
            <TabsTrigger value="entradas" id="tab-entradas">Entradas</TabsTrigger>
            <TabsTrigger value="saidas" id="tab-saidas">Saídas</TabsTrigger>
          </TabsList>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="busca-fin"
              placeholder="Buscar lançamentos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
        </div>

        {["todos", "entradas", "saidas"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="icon-circle bg-muted animate-soft-pulse">
                  <DollarSign className="w-5 h-5 text-muted-foreground/30" />
                </div>
              </div>
            ) : (
              filtrados
                .filter((l) =>
                  tab === "todos" ? true : tab === "entradas" ? l.tipo === "ENTRADA" : l.tipo === "SAIDA"
                )
                .map((lanc) => (
                  <div
                    key={lanc.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-card hover:shadow-[var(--shadow-card)] transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`icon-circle-sm flex-shrink-0 ${lanc.tipo === "ENTRADA" ? "bg-emerald-100" : "bg-red-100"}`}>
                        {lanc.tipo === "ENTRADA" ? (
                          <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{lanc.descricao}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {CATEGORIA_LABELS[lanc.categoria] ?? lanc.categoria}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(lanc.data)}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${lanc.tipo === "ENTRADA" ? "text-emerald-600" : "text-red-500"}`}>
                      {lanc.tipo === "ENTRADA" ? "+" : "-"}{formatCurrency(lanc.valor)}
                    </span>
                  </div>
                ))
            )}
            {!loading && filtrados.filter((l) =>
              tab === "todos" ? true : tab === "entradas" ? l.tipo === "ENTRADA" : l.tipo === "SAIDA"
            ).length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <div className="icon-circle bg-muted mb-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Nenhum lançamento encontrado</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <LancamentoForm
            onSave={() => { setDialogo(false); carregar() }}
            onCancel={() => setDialogo(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
