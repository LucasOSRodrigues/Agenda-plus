// Configuração do Vitest, usado nos testes do back-end (npm test)
// Os testes ficam em tests/, separados do código em src/

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      // Mesmo atalho do tsconfig.json para os tipos compartilhados
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Cobertura (npm run test:coverage): todo o código do back-end, menos a
    // inicialização do servidor e os dados fictícios
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/mocks/**'],
    },
  },
});
