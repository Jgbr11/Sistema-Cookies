/**
 * Módulo de cálculos de negócio para o Sistema Cookies.
 * Centraliza toda lógica de precificação, custo e margem.
 */

interface IngredienteReceita {
  quantidade: number
  custoMedio: number
}

/**
 * Calcula o custo total de uma receita com base nos ingredientes.
 * @param ingredientes - Lista de ingredientes com quantidade e custo médio
 * @returns Custo total da receita
 */
export function calcularCustoReceita(
  ingredientes: IngredienteReceita[]
): number {
  return ingredientes.reduce((total, ing) => {
    return total + ing.quantidade * ing.custoMedio
  }, 0)
}

/**
 * Calcula o custo unitário por cookie.
 * @param custoTotal - Custo total da receita
 * @param quantidadeCookies - Quantidade de cookies produzidos pela receita
 * @returns Custo por cookie
 */
export function calcularCustoPorCookie(
  custoTotal: number,
  quantidadeCookies: number
): number {
  if (quantidadeCookies <= 0) return 0
  return custoTotal / quantidadeCookies
}

/**
 * Calcula a margem de lucro percentual.
 * @param custo - Custo unitário
 * @param precoVenda - Preço de venda
 * @returns Margem de lucro como decimal (0.35 = 35%)
 */
export function calcularMargemLucro(
  custo: number,
  precoVenda: number
): number {
  if (precoVenda <= 0) return 0
  return (precoVenda - custo) / precoVenda
}

/**
 * Sugere um preço de venda com base no custo e margem desejada.
 * @param custo - Custo unitário
 * @param margemDesejada - Margem desejada como decimal (0.35 = 35%)
 * @returns Preço de venda sugerido
 */
export function sugerirPrecoVenda(
  custo: number,
  margemDesejada: number
): number {
  if (margemDesejada >= 1) return 0
  return custo / (1 - margemDesejada)
}

/**
 * Calcula o custo médio ponderado de um ingrediente.
 * @param compras - Lista de compras com quantidade e preço
 * @returns Custo médio por unidade
 */
export function calcularCustoMedio(
  compras: { quantidade: number; precoPago: number }[]
): number {
  const totalQuantidade = compras.reduce((sum, c) => sum + c.quantidade, 0)
  const totalGasto = compras.reduce((sum, c) => sum + c.precoPago, 0)
  if (totalQuantidade <= 0) return 0
  return totalGasto / totalQuantidade
}

/**
 * Calcula quantas receitas podem ser feitas com o estoque atual.
 * @param ingredientesReceita - Ingredientes da receita com quantidade necessária
 * @param estoqueAtual - Estoque atual de cada ingrediente (map id → quantidade)
 * @returns Número máximo de receitas possíveis
 */
export function calcularReceitasPossiveis(
  ingredientesReceita: { ingredienteId: string; quantidade: number }[],
  estoqueAtual: Map<string, number>
): number {
  if (ingredientesReceita.length === 0) return 0

  let minReceitas = Infinity

  for (const ing of ingredientesReceita) {
    const estoque = estoqueAtual.get(ing.ingredienteId) ?? 0
    const possivel = Math.floor(estoque / ing.quantidade)
    minReceitas = Math.min(minReceitas, possivel)
  }

  return minReceitas === Infinity ? 0 : minReceitas
}

/**
 * Identifica ingredientes insuficientes para produzir uma receita.
 * @returns Lista de ingredientes faltantes com déficit
 */
export function identificarIngredientesFaltantes(
  ingredientesReceita: {
    ingredienteId: string
    nome: string
    quantidade: number
    unidade: string
  }[],
  estoqueAtual: Map<string, number>
): { ingredienteId: string; nome: string; falta: number; unidade: string }[] {
  return ingredientesReceita
    .filter((ing) => {
      const estoque = estoqueAtual.get(ing.ingredienteId) ?? 0
      return estoque < ing.quantidade
    })
    .map((ing) => ({
      ingredienteId: ing.ingredienteId,
      nome: ing.nome,
      falta: ing.quantidade - (estoqueAtual.get(ing.ingredienteId) ?? 0),
      unidade: ing.unidade,
    }))
}

/**
 * Gera um código de lote no formato LOT-YYYYMMDD-XXXX.
 * @param sequencial - Número sequencial do dia
 * @returns Código de lote formatado
 */
export function gerarCodigoLote(
  data: Date = new Date(),
  sequencial: number = 1
): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  const seq = String(sequencial).padStart(4, "0")
  return `LOT-${ano}${mes}${dia}-${seq}`
}
