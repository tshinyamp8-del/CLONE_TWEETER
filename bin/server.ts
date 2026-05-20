/*
|--------------------------------------------------------------------------
| HTTP server entrypoint
|--------------------------------------------------------------------------
*/
import 'reflect-metadata'
import http from 'node:http' // 🌟 Module natif Node.js

// 🌟 FORCAGE GLOBAL : On dit à Node.js de supprimer les timeouts par défaut
// sur absolument TOUS les serveurs HTTP créés dans cette instance (Adonis inclus)
http.createServer = ((originalCreateServer) => {
  return function (this: any, ...args: any[]) {
    const server = originalCreateServer.apply(this, args)
    server.timeout = 0         // Temps infini pour ta vidéo de 60 min
    server.headersTimeout = 0  // Désactive le timeout des en-têtes
    return server
  }
})(http.createServer)

const { Ignitor, prettyPrintError } = await import('@adonisjs/core')

/**
 * URL to the application root.
 */
const APP_ROOT = new URL('../', import.meta.url)

/**
 * The importer is used to import files in context of the application.
 */
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

// 🌟 Retour à ton code d'origine propre, sans hooks instables
new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .httpServer()
  .start()
  .catch((error) => {
    process.exitCode = 1
    prettyPrintError(error)
  })