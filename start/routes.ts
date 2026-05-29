import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const AuthController = () => import('#controllers/auth_controller')
const TweetsController = () => import('#controllers/tweets_controller')
const ProfileController = () => import('#controllers/profile_controller')
const FollowsController = () => import('#controllers/follows_controller')

// 1. PAGE DE GARDE (WELCOME)
router.get('/', [AuthController, 'index']).as('home')

// Écran Succès de l'inscription
router.get('success', [AuthController, 'success']).as('signup.success')

// 2. ENCLOS DES INVITÉS (Uniquement si NON connecté)
// Remplacez le bloc existant du groupe "guest" par celui-ci :
router.group(() => {
  router.get('signup', [AuthController, 'register']).as('signup')
  router.post('signup', [AuthController, 'storeRegister']).as('signup.store') // 👈 On s'assure du nom ici
  
  router.get('login', [AuthController, 'login']).as('login')
  router.post('login', [AuthController, 'storeLogin']).as('login.store')
}).use(middleware.guest())

// 3. ENCLOS SÉCURISÉ RENDU VISUEL (Pages HTML classiques Edge)
router.group(() => {
  router.get('home', [AuthController, 'appHome']).as('app.home')
  router.post('logout', [AuthController, 'destroySession']).as('logout')
}).use(middleware.auth())

// 4. ENCLOS SÉCURISÉ API (Requêtes Fetch asynchrones JS)
router.group(() => {
  
  // 💡 Remplacer l'ancienne route par celle-ci pour éviter le JSON vide
  router.get('me', async ({ auth, response }) => {
    try {
      // On vérifie si Adonis arrive à récupérer l'utilisateur via la session
      await auth.check() 
      
      if (!auth.user) {
        // Si aucun utilisateur n'est connecté, on renvoie un objet JSON valide
        return response.ok({ user: null, authenticated: false })
      }
      
      // Si l'utilisateur est connecté, on renvoie ses infos
      return response.ok({ user: auth.user, authenticated: true })
    } catch {
      // En cas de bug ou de token expiré, on renvoie aussi un JSON valide
      return response.ok({ user: null, authenticated: false })
    }
  })

  // Le reste des routes nécessite obligatoirement d'être connecté
  router.group(() => {
    // Flux & Publication
    router.get('tweets', [TweetsController, 'index'])
    router.post('tweets', [TweetsController, 'store'])
    router.delete('tweets/:id', [TweetsController, 'destroy'])
    
    // Interactions
    router.post('tweets/:id/like', [TweetsController, 'toggleLike'])
    router.post('users/:id/follow', [FollowsController, 'toggle']).as('users.follow')
    
    // Édition de profil
    router.put('profile', [ProfileController, 'update'])
  }).use(middleware.auth()) // Protection appliquée uniquement sur ces actions

}).prefix('/api')