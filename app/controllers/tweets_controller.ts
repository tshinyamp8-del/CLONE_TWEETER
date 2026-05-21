import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { stringHelpers } from '@poppinss/utils' 
import fs from 'node:fs'

export default class TweetsController {
  
  // Chargement dynamique des modèles pour contourner le bug d'import ESM
  private async getModels() {
    const { default: Tweet } = await import('#models/tweet')
    const { default: Like } = await import('#models/like')
    return { Tweet, Like }
  }

  /**
   * Récupérer tous les tweets avec le compte des likes et le statut de l'utilisateur connecté
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!
    const { Tweet, Like } = await this.getModels()

    const tweets = await Tweet.query()
      .preload('user')
      .withCount('likes')
      .orderBy('createdAt', 'desc')

    const tweetsWithLikeStatus = await Promise.all(
      tweets.map(async (tweet) => {
        const hasLiked = await Like.query()
          .where('userId', user.id)
          .where('tweetId', tweet.id)
          .first()
        
        return {
          ...tweet.toJSON(),
          contenu: tweet.contenu || tweet.$attributes.content,
          likesCount: tweet.$extras.likes_count,
          hasLiked: !!hasLiked
        }
      })
    )

    return response.json(tweetsWithLikeStatus)
  }

  /**
   * Poster un tweet avec image ou vidéo (jusqu'à 1 heure / 5 Go)
   */
  async store({ request, auth, response }: HttpContext) {
    const user = auth.user!
    const content = request.input('content')
    const { Tweet } = await this.getModels()
    
    const mediaFile = request.file('media', {
      size: '5gb',
      extnames: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mkv']
    })

    let mediaUrl: string | null = null
    let mediaType: 'image' | 'video' | null = null

    if (mediaFile) {
      mediaType = mediaFile.extname && ['mp4', 'mov', 'avi', 'mkv'].includes(mediaFile.extname) ? 'video' : 'image'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${mediaFile.extname}` 
      
      await mediaFile.move(app.publicPath('uploads/tweets'), {
        name: fileName,
        overwrite: true,
      })
      mediaUrl = `/uploads/tweets/${fileName}`
    }

    // 🌟 RECTIFICATION ICI : On enregistre mediaUrl et mediaType en BDD
    const tweet = await Tweet.create({
      userId: user.id,
      content: content || null,
      mediaUrl: mediaUrl,   // Ajouté !
      mediaType: mediaType, // Ajouté !
    })

    await tweet.load('user')
    return response.status(201).json(tweet)
  }

  /**
   * Liker / Unliker un tweet réellement en Base de Données
   */
  async toggleLike({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const tweetId = params.id
    const { Like } = await this.getModels()

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

  /**
   * Supprimer un tweet et son fichier multimédia associé
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const { Tweet } = await this.getModels()
    const tweet = await Tweet.findOrFail(params.id)

    if (tweet.userId !== user.id) {
      return response.status(403).json({ error: 'Non autorisé' })
    }

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