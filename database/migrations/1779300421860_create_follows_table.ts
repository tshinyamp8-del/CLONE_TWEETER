import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'follows'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // L'utilisateur qui clique sur "Suivre"
      table
        .integer('follower_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // L'utilisateur qui est suivi
      table
        .integer('following_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // Sécurité : Empêche un utilisateur de suivre deux fois la même personne
      table.unique(['follower_id', 'following_id'])
      
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}