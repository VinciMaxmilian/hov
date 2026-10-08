import type * as THREE from 'three'

/**
 * Luz indireta dos interiores. Materiais "interiorizados" multiplicam a irradiância do céu/ambiente
 * por este uniform: dentro de casa à noite a única luz útil é a das lâmpadas e da lamparina.
 * Compartilhado pela propriedade procedural (estate) e pelos props do jogo.
 */
export const IA = { value: 0.25 }

export function interiorize<T extends THREE.Material>(m: T): T {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uIA = IA
    sh.fragmentShader =
      'uniform float uIA;\n' +
      sh.fragmentShader.replace(
        '#include <lights_fragment_end>',
        'irradiance *= uIA;\n#if defined( RE_IndirectSpecular )\nradiance *= uIA;\n#endif\n#include <lights_fragment_end>',
      )
  }
  m.customProgramCacheKey = () => 'interior'
  m.userData.interior = true
  return m
}
