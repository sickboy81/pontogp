import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'dist/**', 'next-env.d.ts'],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      'react-hooks/preserve-manual-memoization': 'warn',
      // Hidratação e sincronização de filtros exigem atualizações dentro de effects.
      'react-hooks/set-state-in-effect': 'off',
      // A aplicação desativa a otimização de imagens e usa URLs/blob dinâmicos do PocketBase.
      '@next/next/no-img-element': 'off',
    },
  },
]

export default eslintConfig
