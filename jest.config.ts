import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  // Fichier exécuté après l'initialisation du framework de test (jest-dom, etc.)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Mapping des alias d'import TypeScript
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
}

export default createJestConfig(config)
