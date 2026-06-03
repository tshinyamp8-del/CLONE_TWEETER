import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class FollowsController {
  async toggle({ params, auth, response }: HttpContext) {
    const user = auth.user

    if (!user) {
      return response.unauthorized({ message: 'Not authenticated' })
    }

    const targetUserId = params.id

    const existingFollow = await db
      .from('follows')
      .where('follower_id', user.id)
      .where('following_id', targetUserId)
      .first()

    if (existingFollow) {
      await db
        .from('follows')
        .where('follower_id', user.id)
        .where('following_id', targetUserId)
        .delete()

      return response.ok({ following: false })
    }

    await db.table('follows').insert({
      follower_id: user.id,
      following_id: targetUserId,
      created_at: new Date(),
      updated_at: new Date(),
    })

    return response.ok({ following: true })
  }
}