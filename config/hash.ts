// config/hash.ts
import { defineConfig, drivers } from '@adonisjs/core/hash'

const hashConfig = defineConfig({
  /**
   * On conserve scrypt mais avec des paramètres allégés pour MySQL
   */
  default: 'scrypt',

  list: {
    scrypt: drivers.scrypt({
      cost: 16384,
      blockSize: 8,
      parallelization: 1,
      // 🌟 On augmente la tolérance mémoire pour éviter les corruptions de calcul
      maxMemory: 67108864, 
    }),
  },
})

export default hashConfig

declare module '@adonisjs/core/types' {
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}
