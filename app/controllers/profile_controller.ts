// app/controllers/profile_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'

export default class ProfileController {
  async update({ request, auth, response }: HttpContext) {
    const user = auth.user!
    
    // Récupération des textes
    user.username = request.input('username', user.username)
    // si tu as un champ bio dans ta table :
    // user.bio = request.input('bio', user.bio)

    // Gestion de la photo de profil
    const avatar = request.file('avatar', { size: '5mb', extnames: ['jpg', 'png', 'jpeg'] })
    if (avatar) {
      const avatarName = `avatar-${cuid()}.${avatar.extname}`
      await avatar.move(app.publicPath('uploads/profiles'), { name: avatarName, overwrite: true })
      user.avatarUrl = `/uploads/profiles/${avatarName}`
    }

    // Gestion de la bannière
    const banner = request.file('banner', { size: '10mb', extnames: ['jpg', 'png', 'jpeg'] })
    if (banner) {
      const bannerName = `banner-${cuid()}.${banner.extname}`
      await banner.move(app.publicPath('uploads/profiles'), { name: bannerName, overwrite: true })
      user.bannerUrl = `/uploads/profiles/${bannerName}`
    }

    await user.save()
    return response.json(user)
  }
}