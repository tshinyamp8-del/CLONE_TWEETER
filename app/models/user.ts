import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { column, manyToMany } from '@adonisjs/lucid/orm' // 🌟 Ajout de manyToMany ici
import type * as relations from '@adonisjs/lucid/types/relations'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  
  @column()
  declare username: string

  @column({ serializeAs: null })
  declare password: string

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

  /**
   * Les personnes que CET utilisateur suit
   */
  @manyToMany(() => User, {
    pivotTable: 'follows',
    localKey: 'id',
    pivotForeignKey: 'follower_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'following_id',
  })
  declare following: relations.ManyToMany<typeof User>

  /**
   * Les personnes qui suivent CET utilisateur (ses abonnés)
   */
  @manyToMany(() => User, {
    pivotTable: 'follows',
    localKey: 'id',
    pivotForeignKey: 'following_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'follower_id',
  })
  declare followers: relations.ManyToMany<typeof User>
}