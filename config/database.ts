import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'

const dbConfig = defineConfig({
  /**
   * On force l'utilisation de MySQL pour le local ET la production
   */
  connection: 'mysql',

  prettyPrintDebugQueries: true,

  connections: {
    /**
     * Configuration MySQL unifiée (Local et Production Clever Cloud)
     */
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST'),
        port: Number(env.get('DB_PORT')) || 3306,
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        // 🌟 SSL requis par Clever Cloud en production si la connexion est sécurisée
        ssl: env.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      // Active les logs de requêtes SQL uniquement en développement local
      debug: env.get('NODE_ENV') !== 'production', 
    },
  },
})

export default dbConfig
