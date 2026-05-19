// app/controllers/tweets_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Tweet from '#models/tweet' 
import Like from '#models/like' // Ton modèle de Like réel
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import fs from 'node:fs'

export default class TweetsController {
  // Récupérer les tweets avec le compte des likes et si l'utilisateur connecté a liké
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const tweets = await Tweet.query()
      .preload('user')
      .withCount('likes')
      .orderBy('createdAt', 'desc')

    // On ajoute dynamiquement une propriété pour savoir si l'user connecté a liké
    const tweetsWithLikeStatus = await Promise.all(tweets.map(async (tweet) => {
      const hasLiked = await Like.query()
        .where('userId', user.id)
        .where('tweetId', tweet.id)
        .first()
      
      return {
        ...tweet.toJSON(),
        likesCount: tweet.$extras.likes_count,
        hasLiked: !!hasLiked
      }
    }))

    return response.json(tweetsWithLikeStatus)
  }

  // Sauvegarder un post (Texte + Image ou Vidéo lourde)
  async store({ request, auth, response }: HttpContext) {
    const user = auth.user!
    const content = request.input('content')
    const mediaFile = request.file('media', {
      size: '500mb',
      extnames: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'avi']
    })

    let mediaUrl: string | null = null
    let mediaType: 'image' | 'video' | null = null

    if (mediaFile) {
      mediaType = mediaFile.extname && ['mp4', 'mov', 'avi'].includes(mediaFile.extname) ? 'video' : 'image'
      const fileName = `${cuid()}.${mediaFile.extname}`
      
      await mediaFile.move(app.publicPath('uploads/tweets'), {
        name: fileName,
        overwrite: true,
      })
      mediaUrl = `/uploads/tweets/${fileName}`
    }

    const tweet = await Tweet.create({
      userId: user.id,
      content: content || '',
      mediaUrl,
      mediaType
    })

    await tweet.load('user')
    return response.status(201).json(tweet)
  }

  // Liker / Unliker réellement
  async toggleLike({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const tweetId = params.id

    const existingLike = await Like.query()
      .where('userId', user.id)
      .where('tweetId', tweetId)
      .first()

    if (existingLike) {
      await existingLike.delete()
      return response.json({ liked: false })
    } else {
      await Like.create({ userId: user.id, tweetId })
      return response.json({ liked: true })
    }
  }

  // Supprimer un tweet et son fichier associé
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const tweet = await Tweet.findOrFail(params.id)

    // Sécurité : Seul l'auteur peut supprimer son tweet
    if (tweet.userId !== user.id) {
      return response.status(403).json({ error: 'Non autorisé' })
    }

    // Supprimer le fichier physique (image/vidéo) du disque s'il existe
    if (tweet.mediaUrl) {
      const absolutePath = app.publicPath(tweet.mediaUrl.replace(/^\//, ''))
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath)
      }
    }

    await tweet.delete()
    return response.json({ success: true })
  }
}