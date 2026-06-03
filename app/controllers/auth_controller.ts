import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user' 
import hash from '@adonisjs/core/services/hash'

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

  // app/controllers/auth_controller.ts
  async storeRegister({ request, response, session }: HttpContext) {
    const payload = request.only(['username', 'email', 'password'])
  
    try {
      await User.create({
        username: payload.username,
        fullName: payload.username,
        email: payload.email.toLowerCase().trim(),
        password: payload.password
      })
  
      return response.redirect().toRoute('signup.success')
    } catch (error: any) {
      console.error("Erreur d'inscription :", error)
      session.flash('errors', { global: `Erreur d'inscription` })
      return response.redirect().back()
    }
  }


  async storeLogin({ request, auth, response, session }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
  
    try {
      const normalizedEmail = email.toLowerCase().trim()
  
      const user = await User.verifyCredentials(normalizedEmail, password)
  
      await auth.use('web').login(user)
  
      return response.redirect().toRoute('app.home')
  
    } catch (error) {
      console.error("Erreur de connexion :", error.message)
  
      session.flash('errors', {
        login: "Identifiants invalides."
      })
  
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