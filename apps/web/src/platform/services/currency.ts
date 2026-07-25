const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export const currencyService = {
  formatBRL(value: number) {
    return brl.format(value)
  },
}
