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

  async storeRegister({ request, response, session }: HttpContext) {
    const payload = request.only(['username', 'email', 'password'])
  
    try {
      // 🚀 CORRECTION : Utilisation de User.create pour activer le hachage automatique
      await User.create({
        username: payload.username,
        fullName: payload.username,
        email: payload.email,
        password: payload.password
      })
  
      // Redirection vers la page "success" comme vous le souhaitez
      return response.redirect().toRoute('signup.success')
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error)
      session.flash('errors', { global: `Erreur d'inscription : ${error.message || error}` })
      return response.redirect().back()
    }
  }
  
  
  
  async storeLogin({ request, auth, response, session }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
  
    try {
      const userModel = User as any
      // 1. Tente de vérifier les identifiants
      const user = await userModel.verifyCredentials(email, password)
      
      // 2. Connecte l'utilisateur
      await (auth.use('web') as any).login(user)
  
      // 3. Force la sauvegarde de la session
      await session.commit()
  
      // 4. Redirige vers l'accueil
      return response.redirect().toRoute('app.home')
    } catch (error: any) {
      console.error("Erreur de connexion détaillée :", error)
      
      // 💡 FORCE l'affichage de la vraie erreur technique sur l'écran de l'utilisateur
      const errorMessage = error.message || error.code || "Identifiants invalides"
      session.flash('errors', { login: `Échec de connexion : ${errorMessage}` })
      
      // Conserve l'email dans le formulaire pour qu'il ne disparaisse plus
      session.flash('email', email) 
      
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