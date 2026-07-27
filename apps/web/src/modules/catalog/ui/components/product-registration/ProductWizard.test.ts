import { describe, expect, it } from 'vitest'
import { buildVariantCombinationLabels } from './ProductWizard'

describe('buildVariantCombinationLabels', () => {
  it('gera o produto cartesiano dos atributos sem duplicar regras do domínio', () => {
    expect(
      buildVariantCombinationLabels([
        { labels: ['Azul', 'Branco'] },
        { labels: ['P', 'M', 'G'] },
      ]),
    ).toEqual([
      'Azul / P',
      'Azul / M',
      'Azul / G',
      'Branco / P',
      'Branco / M',
      'Branco / G',
    ])
  })

  it('não cria combinações sem eixos selecionados', () => {
    expect(buildVariantCombinationLabels([])).toEqual([])
  })
})
