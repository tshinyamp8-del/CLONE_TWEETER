// app/controllers/follows_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class FollowsController {
  /**
   * Gère l'abonnement / désabonnement (Toggle)
   */
  async toggle({ params, auth, response }: HttpContext) {
    const user = auth.user!          // L'utilisateur connecté (celui qui clique)
    const targetUserId = params.id   // L'utilisateur qu'on veut suivre

    // 1. Vérifier si l'abonnement existe déjà dans la table `follows`
    const existingFollow = await db
      .from('follows')
      .where('follower_id', user.id)       // Remplace par le nom exact de ta colonne si différent
      .where('following_id', targetUserId)  // Remplace par le nom exact de ta colonne si différent
      .first()

    if (existingFollow) {
      // 2. Si ça existe -> On supprime (Unfollow)
      await db
        .from('follows')
        .where('follower_id', user.id)
        .where('following_id', targetUserId)
        .delete()

      return response.json({ following: false })
    } else {
      // 3. Si ça n'existe pas -> On crée (Follow)
      await db
        .table('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
          created_at: new Date(),
          updated_at: new Date()
        })

      return response.json({ following: true })
    }
  }
}