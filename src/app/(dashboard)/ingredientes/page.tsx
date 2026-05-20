"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Search, Wheat, TrendingUp, TrendingDown, Package, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils"

interface Ingrediente {
  id: string
  nome: string
  unidadeMedida: string
  categoria: string
  estoqueAtual: number
  estoqueMinimo: number
  fornecedor: { id: string; nome: string } | null
  compras?: {
    dataCompra: string
    precoPago: number
    pesoComprado: number
    quantidade: number
    validade?: string
  }[]
  ultimaCompra?: {
    dataCompra: string
    precoPago: number
    pesoComprado: number
    quantidade: number
    validade?: string
  } | null
}

const UNIDADES = ["g", "kg", "ml", "L", "unidade", "caixa", "pacote"]

/**
 * Formulário simplificado: apenas Nome, Unidade de Medida e Estoque Mínimo.
 */
function IngredienteForm({
  ingrediente,
  onSave,
  onCancel,
}: {
  ingrediente: Partial<Ingrediente> | null
  onSave: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    nome: ingrediente?.nome ?? "",
    unidadeMedida: ingrediente?.unidadeMedida ?? "g",
    estoqueMinimo: String(ingrediente?.estoqueMinimo ?? "0"),
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = ingrediente?.id
        ? `/api/ingredientes/${ingrediente.id}`
        : "/api/ingredientes"
      const method = ingrediente?.id ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: form.nome,
          unidadeMedida: form.unidadeMedida,
          estoqueMinimo: Number(form.estoqueMinimo),
          // categoria com valor padrão para satisfazer o banco
          categoria: ingrediente?.categoria ?? "Outros",
        }),
      })

      if (!res.ok) throw new Error("Erro ao salvar")
      toast.success(ingrediente?.id ? "Ingrediente atualizado!" : "Ingrediente criado!")
      onSave()
    } catch {
      toast.error("Erro ao salvar ingrediente")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="nome-ing">Nome</Label>
        <Input
          id="nome-ing"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          placeholder="Ex: Farinha de Trigo"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="unidade-ing">Unidade de Medida</Label>
          <Select
            value={form.unidadeMedida}
            onValueChange={(v) => setForm({ ...form, unidadeMedida: v ?? "g" })}
          >
            <SelectTrigger id="unidade-ing">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIDADES.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="estoque-min">Estoque Mínimo</Label>
          <Input
            id="estoque-min"
            type="number"
            min="0"
            step="0.1"
            value={form.estoqueMinimo}
            onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} id="ing-form-cancel">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} id="ing-form-save"
          className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90"
        >
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  )
}

/**
 * Página de Gestão de Ingredientes.
 * Lista todos os ingredientes com estoque atual, custo médio e alertas.
 */
export default function IngredientesPage() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [dialogo, setDialogo] = useState<"criar" | "editar" | null>(null)
  const [selecionado, setSelecionado] = useState<Ingrediente | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ingredientes")
      setIngredientes(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Excluir "${nome}"? Esta ação não pode ser desfeita.`)) return
    try {
      const res = await fetch(`/api/ingredientes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Ingrediente excluído!")
      carregar()
    } catch {
      toast.error("Erro ao excluir ingrediente")
    }
  }

  const filtrados = ingredientes.filter((ing) =>
    ing.nome.toLowerCase().includes(busca.toLowerCase())
  )

  function custoMedio(ing: Ingrediente): number {
    if (!ing.compras?.length) return 0
    const totalGasto = ing.compras.reduce((s, c) => s + c.precoPago, 0)
    const totalPeso = ing.compras.reduce((s, c) => s + c.pesoComprado * c.quantidade, 0)
    return totalPeso > 0 ? totalGasto / totalPeso : 0
  }

  const estoqueBaixo = ingredientes.filter((ing) => ing.estoqueAtual <= ing.estoqueMinimo)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">
            {ingredientes.length} ingrediente(s) cadastrado(s)
            {estoqueBaixo.length > 0 && (
              <span className="ml-2 text-destructive font-medium">
                · {estoqueBaixo.length} com estoque baixo
              </span>
            )}
          </p>
        </div>
        <Button
          id="btn-novo-ingrediente"
          onClick={() => { setSelecionado(null); setDialogo("criar") }}
          className="bg-[#0a0a50] text-[#eff7cf] hover:bg-[#0a0a50]/90 flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Ingrediente
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="busca-ingredientes"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Wheat className="w-8 h-8 text-muted-foreground/30 animate-pulse" />
        </div>
      ) : filtrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40 text-center">
            <Wheat className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {busca ? "Nenhum ingrediente encontrado" : "Nenhum ingrediente cadastrado ainda"}
            </p>
            {!busca && (
              <Button
                variant="link"
                className="text-[#0a0a50] mt-1"
                onClick={() => { setSelecionado(null); setDialogo("criar") }}
              >
                Cadastrar primeiro ingrediente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map((ing) => {
            const baixo = ing.estoqueAtual <= ing.estoqueMinimo
            const custoPorUnidade = custoMedio(ing)
            const ultimaCompra = ing.compras?.[0]

            return (
              <Card
                key={ing.id}
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${baixo ? "border-destructive/40 bg-destructive/5" : ""}`}
              >
                {baixo && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold text-[#0a0a50] truncate">
                        {ing.nome}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {ing.unidadeMedida}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-[#0a0a50]"
                        onClick={() => { setSelecionado(ing); setDialogo("editar") }}
                        id={`edit-ing-${ing.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(ing.id, ing.nome)}
                        id={`delete-ing-${ing.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Estoque */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Estoque atual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${baixo ? "text-destructive" : "text-foreground"}`}>
                        {formatNumber(ing.estoqueAtual, 0)} {ing.unidadeMedida}
                      </span>
                      {baixo && (
                        <Badge variant="destructive" className="text-xs px-1.5">
                          Baixo
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Estoque mínimo */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Mínimo</span>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(ing.estoqueMinimo, 0)} {ing.unidadeMedida}
                    </span>
                  </div>

                  {/* Custo médio */}
                  {custoPorUnidade > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {custoPorUnidade > 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">Custo médio</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency(custoPorUnidade)}/{ing.unidadeMedida}
                      </span>
                    </div>
                  )}

                  {/* Última compra */}
                  {ultimaCompra && (
                    <div className="text-xs text-muted-foreground">
                      Última compra: <span className="text-foreground">{formatDate(ultimaCompra.dataCompra)}</span>
                      {" · "}<span className="text-foreground">{formatCurrency(ultimaCompra.precoPago)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={dialogo !== null} onOpenChange={(open) => !open && setDialogo(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialogo === "editar" ? `Editar: ${selecionado?.nome}` : "Novo Ingrediente"}
            </DialogTitle>
          </DialogHeader>
          <IngredienteForm
            ingrediente={selecionado}
            onSave={() => { setDialogo(null); carregar() }}
            onCancel={() => setDialogo(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
