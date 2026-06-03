import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, beforeSave } from '@adonisjs/lucid/orm' 
import type * as relations from '@adonisjs/lucid/types/relations'

const AuthFinderMixin = withAuthFinder(hash)

export default class User extends compose(BaseModel, AuthFinderMixin) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare username: string

  @column({ serializeAs: null })
  declare password: string

  @column({ columnName: 'full_name' }) // 🌟 Mappage MySQL strict
  declare fullName: string | null

  @column()
  declare bio: string | null

  @column({ columnName: 'avatar_url' }) // 🌟 Mappage MySQL strict
  declare avatarUrl: string | null

  @column({ columnName: 'banner_url' }) // 🌟 Mappage MySQL strict
  declare bannerUrl: string | null

  // ==========================================
  // 🌟 FIX : AJOUT DES TIMESTAMPS AUTOMATIQUES EXPLICITES
  // ==========================================
  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ columnName: 'updated_at', autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // ==========================================
  // 💡 HOOK DE HACHAGE AUTOMATIQUE DU MOT DE PASSE
  // ==========================================
 

  // ==========================================
  // 💡 GETTER POUR LES INITIALES
  // ==========================================
  get initials() {
    const [first, last] = this.fullName ? this.fullName.split(' ') : this.email.split('@')
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
    }
    return `${first.slice(0, 2)}`.toUpperCase()
  }

  // ==========================================
  // 🌟 RELATIONS D'ABONNEMENTS (MANY-TO-MANY)
  // ==========================================
  @manyToMany(() => User, {
    pivotTable: 'follows',
    localKey: 'id',
    pivotForeignKey: 'follower_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'following_id',
  })
  declare following: relations.ManyToMany<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'follows',
    localKey: 'id',
    pivotForeignKey: 'following_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'follower_id',
  })
  declare followers: relations.ManyToMany<typeof User>
}
