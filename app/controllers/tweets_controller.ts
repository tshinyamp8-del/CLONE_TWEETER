import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
// import { string } from '@adonisjs/core/helpers' 
import fs from 'node:fs'
// import { Bouncer } from '@adonisjs/bouncer'
// import { policies } from '#policies/main' // 🌟 Importation des politiques

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
    // 1. Sécurité d'authentification : on s'assure que l'utilisateur n'est pas "null"
    const user = auth.user
    if (!user) {
      return response.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' })
    }
  
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
  
    try {
      // 2. Création sécurisée avec double vérification des propriétés du modèle
      const tweetData: any = {
        userId: user.id,
        mediaUrl: mediaUrl,   
        mediaType: mediaType,
      }
  
      // On alimente à la fois 'content' et 'contenu' pour correspondre à ton modèle
      if (content) {
        tweetData.content = content
        tweetData.contenu = content
      }
  
      const tweet = await Tweet.create(tweetData)
  
      // 3. Charger la relation de l'utilisateur pour le frontend
      await tweet.load('user')
      
      // On s'assure que la réponse renvoie le bon champ textuel attendu par ton app.js
      const responseData = {
        ...tweet.toJSON(),
        contenu: content,
        content: content
      }
  
      return response.status(201).json(responseData)
  
    } catch (error) {
      // Si MySQL refuse l'insertion, tu le verras immédiatement dans ton terminal !
      console.error("💥 Erreur d'écriture MySQL dans store :", error)
      return response.status(500).json({ error: 'Erreur serveur lors de la sauvegarde du tweet.' })
    }
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

   
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const { Tweet } = await this.getModels()
    const tweet = await Tweet.findOrFail(params.id)

    // 🌟 VÉRIFICATION SÉCURITÉ DIRECTE (Alternative parfaite à Bouncer)
    const authorId = tweet.userId || tweet.$attributes?.userId
    if (Number(user.id) !== Number(authorId)) {
      return response.status(403).json({ error: 'Suppression interdite. Ce tweet ne vous appartient pas.' })
    }

    // Nettoyage du fichier multimédia s'il existe
    if (tweet.mediaUrl) {
      const absolutePath = app.publicPath(tweet.mediaUrl.replace(/^\//, ''))
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath)
      }
    }

    // Suppression en BDD
    await tweet.delete()
    return response.json({ success: true })
  }
}