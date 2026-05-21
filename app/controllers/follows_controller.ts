import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class FollowsController {
  async toggle({ auth, params, response }: HttpContext) {
    const currentUser = auth.user!
    const targetUserId = params.id

    // 1. Sécurité : On ne peut pas se suivre soi-même
    if (currentUser.id === Number(targetUserId)) {
      return response.badRequest('Vous ne pouvez pas vous suivre vous-même')
    }

    // 2. Vérifier si l'utilisateur cible existe
    const targetUser = await User.findOrFail(targetUserId)

    // 3. Vérifier si on le suit déjà
    const alreadyFollowing = await currentUser
      .related('following')
      .pivotQuery()
      .where('following_id', targetUser.id)
      .first()

    if (alreadyFollowing) {
      // Unfollow : On détache la relation
      await currentUser.related('following').detach([targetUser.id])
    } else {
      // Follow : On attache la relation
      await currentUser.related('following').attach([targetUser.id])
    }

    // 4. Redirection vers la page d'où vient l'utilisateur
    return response.redirect().back()
  }
}