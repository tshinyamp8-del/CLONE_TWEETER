import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'
import fs from 'node:fs' // 👈 Import essentiel pour détecter le volume Fly

// On détecte si on est sur Fly.io en vérifiant si le dossier /data existe
const isFlyIo = fs.existsSync('/data')

const dbConfig = defineConfig({
  /**
   * Connexion par défaut : Si on est sur Fly, on FORCE 'sqlite'. 
   * Sinon, on prend la variable d'environnement ou 'mysql' par défaut pour ton local.
   */
  connection: isFlyIo ? 'sqlite' : (env.get('DB_CONNECTION') || 'mysql'),

  prettyPrintDebugQueries: true,

  connections: {
    /**
     * Configuration SQLite unifiée
     */
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        // Il va lire directement la variable DB_DATABASE (" /data/sqlite.db ") injectée par le fly.toml
        filename: env.get('DB_DATABASE') || app.tmpPath('db.sqlite3'),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },

    /**
     * Configuration MySQL pour ton développement local
     */
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST') || '127.0.0.1',
        port: Number(env.get('DB_PORT')) || 3306,
        user: env.get('DB_USER') || 'root',
        password: env.get('DB_PASSWORD') || '',
        database: env.get('DB_DATABASE') || 'mon_clone_x',
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },
  },
})

export default dbConfig