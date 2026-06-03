import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('bio').nullable()
      table.string('avatar_url').nullable()
      table.string('banner_url').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('bio')
      table.dropColumn('avatar_url')
      table.dropColumn('banner_url')
    })
  }
}
