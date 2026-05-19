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

  async storeRegister({ request, response }: HttpContext) {
    const payload = request.only(['username', 'email', 'password'])
  
    try {
      // On crée l'instance pour laisser les mixins d'Adonis v7 agir sur les propriétés
      const user = new User()
      user.username = payload.username
      user.fullName = payload.username // Évite l'erreur de valeur par défaut MySQL
      user.email = payload.email
      user.password = payload.password // Le mixin d'authentification s'occupe du hachage unique ici
  
      await user.save()
  
      return response.redirect().toRoute('signup.success')
    } catch (error) {
      console.error(error)
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