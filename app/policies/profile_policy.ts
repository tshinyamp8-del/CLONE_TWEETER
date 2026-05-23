// app/policies/profile_policy.ts
import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'

export default class ProfilePolicy extends BasePolicy {
  /**
   * Un utilisateur ne peut modifier un profil QUE si c'est le sien
   * @param user L'utilisateur actuellement connecté (injecté automatiquement)
   * @param targetUser L'utilisateur que l'on tente de modifier
   */
  async update(user: User, targetUser: User) { // 🌟 Renommé de 'edit' à 'update'
    return Number(user.id) === Number(targetUser.id)
  }
}