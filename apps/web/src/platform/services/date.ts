const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const dateService = {
  formatDate(value: string | Date) {
    return dateFmt.format(typeof value === 'string' ? new Date(value) : value)
  },
  formatDateTime(value: string | Date) {
    return dateTimeFmt.format(typeof value === 'string' ? new Date(value) : value)
  },
}
