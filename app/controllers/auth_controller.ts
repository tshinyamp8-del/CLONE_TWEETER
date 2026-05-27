import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user' // Ajuste le chemin selon ton architecture

export default class AuthController {
  
  async index({ view }: HttpContext) {
    return view.render('pages/welcome')
  }

  async register({ view }: HttpContext) {
    return view.render('pages/register')
  }

  async login({ view }: HttpContext) {
    return view.render('pages/login')
  }

  async storeRegister({ request, auth, response }: HttpContext) { // 👈 Ajout de 'auth' ici
    const payload = request.only(['username', 'email', 'password'])
  
    try {
      const user = new User()
      user.username = payload.username
      user.fullName = payload.username 
      user.email = payload.email
      user.password = payload.password 
  
      await user.save()

      // 💡 ÉTAPE CRUCIALE : Connecter automatiquement l'utilisateur qui vient de s'inscrire
      await auth.use('web').login(user)
  
      // 🚀 REDIRECTION DIRECTE : On l'envoie sur l'application connectée
      return response.redirect().toRoute('app.home')
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error)
      return response.redirect().back()
    }
  }
  async storeLogin({ request, auth, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      // Vérification des identifiants et création de la session
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)

      // Redirection vers l'accueil de l'application
      return response.redirect().toRoute('app.home')
    } catch (error) {
      console.error(error)
      // Retour au formulaire avec une erreur générique
      return response.redirect().back()
    }
  }

  async destroySession({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toRoute('login')
  }

  async success({ view }: HttpContext) {
    return view.render('pages/success')
  }

  async appHome({ view }: HttpContext) {
    return view.render('pages/app') 
  }
}