import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Like from '#models/like'

export default class Tweet extends BaseModel {
  public static table = 'posts'
  
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'contenu' })
  declare content: string | null

  @column({ columnName: 'media_url' })
  declare mediaUrl: string | null

  @column({ columnName: 'media_type' })
  declare mediaType: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Like, {
    foreignKey: 'tweetId'
  })
  declare likes: HasMany<typeof Like>
}