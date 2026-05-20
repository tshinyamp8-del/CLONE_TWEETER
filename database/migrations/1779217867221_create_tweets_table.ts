import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tweets'

  async up() {
    this.schema.createTable(this.tableName, {
      id: this.schema.increment(),
      user_id: this.schema.integer().unsigned().references('id').inTable('users').onDelete('CASCADE'),
      content: this.schema.text('long').nullable(),
      media_url: this.schema.string('255').nullable(),
      media_type: this.schema.string('50').nullable(), // 'image' ou 'video'
      created_at: this.schema.timestamp('created_at'),
      updated_at: this.schema.timestamp('updated_at'),
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}