import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env' // 👈 1. Import indispensable pour lire le .env

const dbConfig = defineConfig({
  /**
   * Default connection used for all queries.
   */
  connection: 'mysql', // 👈 2. On change 'sqlite' par 'mysql'

  /**
   * Pretty-print SQL debug output in development logs.
   */
  prettyPrintDebugQueries: true,

  connections: {
    /**
     * SQLite connection (default).
     */
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename: app.tmpPath('db.sqlite3'),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },

    /**
     * MySQL / MariaDB connection. 👈 3. Décommenté et activé
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