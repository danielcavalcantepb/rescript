import { describe, expect, it } from 'vitest'
import { buildEan13, buildVariantCombinationLabels } from './ProductWizard'

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

  it('gera um EAN-13 válido com dígito verificador', () => {
    expect(buildEan13('200000000001')).toBe('2000000000015')
  })

  it('rejeita uma base que não contenha doze dígitos', () => {
    expect(() => buildEan13('2001')).toThrow('EAN-13 requires 12 base digits.')
  })
})
