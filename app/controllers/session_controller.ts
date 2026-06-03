import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * SessionController handles user authentication and session management.
 * It provides methods for displaying the login page, authenticating users,
 * and logging out.
 */
export default class SessionController {
  /**
   * Display the login page
   */
  async create({ view }: HttpContext) {
    return view.render('pages/auth/login')
  }

  /**
   * Authenticate user credentials and create a new session
   */
  /**
   * Authenticate user credentials and create a new session
   */
  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    try {
      // 1. Vérification des identifiants (lève une erreur si invalide)
      const user = await User.verifyCredentials(email, password)

      // 2. Connexion de l'utilisateur
      await auth.use('web').login(user)
      
      // 3. Persistance de la session avant redirection
      await session.commit()

      // 4. Redirection explicite avec un RETURN
      return response.redirect().toRoute('home') // Assurez-vous que le nom de la route est bien 'home' ou 'app.home'
      
    } catch (error) {
      console.error("Échec de l'authentification :", error.message)
      
      // Renvoie l'erreur au formulaire Edge
      session.flash('errors', { login: 'Échec de connexion : Invalid user credentials' })
      // Conserve l'email saisi pour le confort de l'utilisateur
      session.flash('email', email) 

      // Retour à la page de login
      return response.redirect().back()
    }
  }
