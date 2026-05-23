// app/policies/main.ts
import User from '#models/user'
import Tweet from '#models/tweet'
import { Bouncer } from '@adonisjs/bouncer'

export const policies = {
  // Règle pour le Profil
  ProfilePolicy: () => import('#policies/profile_policy'),
  
  // Règle pour les Tweets
  TweetPolicy: () => import('#policies/tweet_policy'),
}