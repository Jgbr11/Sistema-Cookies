"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Search, Factory, Cookie, Calendar, User, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { formatDate, formatDateTime, formatNumber } from "@/lib/utils"

interface Receita {
  id: string
  nome: string
  qtdCookies: number
  precoVenda: number | null
}

interface Producao {
  id: string
  lote: string
  qtdProduzida: number
  dataFabricacao: string
  dataValidade: string | null
  responsavel: string | null
  observacoes: string | null
  createdAt: string
  receita: Receita
}

function ProducaoForm({
  receitas,
  onSave,
  onCancel,
}: {
  receitas: Receita[]
  onSave: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    receitaId: "",
    qtdProduzida: "",
    dataFabricacao: new Date().toISOString().split("T")[0],
    dataValidade: "",
    responsavel: "",
    observacoes: "",
  })
  const [saving, setSaving] = useState(false)

  const receitaSelecionada = receitas.find((r) => r.id === form.receitaId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/producao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          qtdProduzida: Number(form.qtdProduzida),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erro")
      }

      toast.success("Produção registrada! Estoque atualizado automaticamente.")
      onSave()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao registrar produção")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="receita-prod">Receita</Label>
          <Select value={form.receitaId} onValueChange={(v) => setForm({ ...form, receitaId: v || "" })}>
            <SelectTrigger id="receita-prod">
              <SelectValue placeholder="Selecionar receita..." />
            </SelectTrigger>
            <SelectContent>
              {receitas.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {receitaSelecionada && (
          <div className="col-span-2 p-3 bg-muted/50 rounded-lg text-sm">
            <p className="text-muted-foreground">
              Receita: <span className="text-foreground font-medium">{receitaSelecionada.nome}</span>
              {" · "}{receitaSelecionada.qtdCookies} cookies por lote
            </p>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="qtd-prod">Qtd de Cookies Produzidos</Label>
          <Input
            id="qtd-prod"
            type="number"
            min="1"
            value={form.qtdProduzida}
            onChange={(e) => setForm({ ...form, qtdProduzida: e.target.value })}
            required
            placeholder="Ex: 48"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="data-fab">Data de Fabricação</Label>
          <Input
            id="data-fab"
            type="date"
            value={form.dataFabricacao}
            onChange={(e) => setForm({ ...form, dataFabricacao: e.target.value })}
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="data-val">Data de Validade</Label>
          <Input
            id="data-val"
            type="date"
            value={form.dataValidade}
            onChange={(e) => setForm({ ...form, dataValidade: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="responsavel-prod">Responsável</Label>
          <Input
            id="responsavel-prod"
            value={form.responsavel}
            onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            placeholder="Nome do responsável"
          />
        </div>

        <div className="col-span-2 space-y-1">
          <Label htmlFor="obs-prod">Observações</Label>
          <Textarea
            id="obs-prod"
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            rows={2}
          />
        </div>
      </div>

      <div className="p-3 bg-[#0a0a50]/5 rounded-lg text-xs text-muted-foreground">
        ℹ️ Ao registrar a produção, os ingredientes serão descontados do estoque automaticamente.
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} id="prod-form-cancel">Cancelar</Button>
        <Button type="submit" disabled={saving} id="prod-form-save" className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90">
          {saving ? "Registrando..." : "Registrar Produção"}
        </Button>
      </div>
    </form>
  )
}

/**
 * Página de Gestão de Produção.
 * Registra produções, gera lotes automáticos e desconta ingredientes do estoque.
 */
export default function ProducaoPage() {
  const [producoes, setProducoes] = useState<Producao[]>([])
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [dialogo, setDialogo] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [resProd, resRec] = await Promise.all([
        fetch("/api/producao"),
        fetch("/api/receitas"),
      ])
      setProducoes(await resProd.json())
      setReceitas((await resRec.json()).filter((r: Receita & { ativa: boolean }) => r.ativa))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const filtradas = producoes.filter((p) =>
    p.receita.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.lote.toLowerCase().includes(busca.toLowerCase())
  )

  // Totais do dia
  const hoje = new Date().toISOString().split("T")[0]
  const producaoHoje = producoes
    .filter((p) => p.dataFabricacao.startsWith(hoje))
    .reduce((sum, p) => sum + p.qtdProduzida, 0)

  function isVencendo(dataValidade: string | null): boolean {
    if (!dataValidade) return false
    const diff = new Date(dataValidade).getTime() - Date.now()
    return diff < 3 * 24 * 60 * 60 * 1000
  }

  return (
    <div className="space-y-5">
      {/* Resumo do dia */}
      {producaoHoje > 0 && (
        <div className="p-4 bg-[#0a0a50]/5 border border-[#0a0a50]/20 rounded-xl flex items-center gap-3">
          <Factory className="w-5 h-5 text-[#0a0a50]" />
          <div>
            <p className="text-sm font-semibold text-[#0a0a50]">
              {formatNumber(producaoHoje, 0)} cookies produzidos hoje
            </p>
            <p className="text-xs text-muted-foreground">
              em {producoes.filter((p) => p.dataFabricacao.startsWith(hoje)).length} lote(s)
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {producoes.length} produção(ões) registrada(s)
        </p>
        <Button
          id="btn-nova-producao"
          onClick={() => setDialogo(true)}
          className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90 flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Registrar Produção
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="busca-producao"
          placeholder="Buscar por receita ou lote..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Factory className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
        </div>
      ) : filtradas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-center">
            <Factory className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {busca ? "Nenhuma produção encontrada" : "Nenhuma produção registrada ainda"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtradas.map((prod) => {
            const vencendo = isVencendo(prod.dataValidade)

            return (
              <Card key={prod.id} className={vencendo ? "border-warning/40 bg-warning/5" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold text-[#0a0a50]">
                        {prod.receita.nome}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs font-mono">
                          {prod.lote}
                        </Badge>
                        {vencendo && prod.dataValidade && (
                          <Badge variant="outline" className="text-xs border-warning text-orange-600">
                            Vence em {formatDate(prod.dataValidade)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 text-[#0a0a50]">
                        <Cookie className="w-4 h-4" />
                        <span className="text-lg font-bold">{prod.qtdProduzida}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">cookies</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Fabricação: <span className="text-foreground">{formatDate(prod.dataFabricacao)}</span></span>
                    </div>
                    {prod.dataValidade && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Validade: <span className={`font-medium ${vencendo ? "text-orange-600" : "text-foreground"}`}>
                          {formatDate(prod.dataValidade)}
                        </span></span>
                      </div>
                    )}
                    {prod.responsavel && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        <span>{prod.responsavel}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
                      <Pencil className="w-3 h-3" />
                      <span className="text-xs">{formatDateTime(prod.createdAt)}</span>
                    </div>
                  </div>
                  {prod.observacoes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{prod.observacoes}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogo} onOpenChange={setDialogo}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Produção</DialogTitle>
          </DialogHeader>
          <ProducaoForm
            receitas={receitas}
            onSave={() => { setDialogo(false); carregar() }}
            onCancel={() => setDialogo(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
