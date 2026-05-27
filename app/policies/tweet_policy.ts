// app/policies/tweet_policy.ts
import User from '#models/user'
import { BasePolicy } from '@adonisjs/bouncer'

export default class TweetPolicy extends BasePolicy {
  async destroy(user: User, tweet: any) {
    // 🌟 Sécurité : on vérifie les deux syntaxes possibles (userId ou user_id)
    const authorId = tweet.userId || tweet.user_id || tweet.$attributes?.userId || tweet.$attributes?.user_id
    
    console.log(`[Bouncer] User connecté: ${user.id} | Auteur du Tweet: ${authorId}`)
    
    return Number(user.id) === Number(authorId)
  }
}