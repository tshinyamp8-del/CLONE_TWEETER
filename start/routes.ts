import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const AuthController = () => import('#controllers/auth_controller')
const TweetsController = () => import('#controllers/tweets_controller')
const ProfileController = () => import('#controllers/profile_controller')

// 1. PAGE DE GARDE (WELCOME)
router.get('/', [AuthController, 'index']).as('home')

// Écran Succès de l'inscription (Accessible par tous pour transition)
router.get('success', [AuthController, 'success']).as('signup.success')

// 2. ENCLOS DES INVITÉS (Uniquement si NON connecté)
router.group(() => {
  router.get('signup', [AuthController, 'register']).as('signup')
  router.post('signup', [AuthController, 'storeRegister']).as('signup.store')
  
  router.get('login', [AuthController, 'login']).as('login')
  router.post('login', [AuthController, 'storeLogin']).as('login.store')
}).use(middleware.guest())

// 3. ENCLOS SÉCURISÉ (Uniquement si CONNECTÉ)
router.group(() => {
  router.get('home', [AuthController, 'appHome']).as('app.home')
  router.post('logout', [AuthController, 'destroySession']).as('logout')
}).use(middleware.auth())

router.group(() => {
  // Flux & Publication
  router.get('/tweets', [TweetsController, 'index'])
  router.post('/tweets', [TweetsController, 'store'])
  router.delete('/tweets/:id', [TweetsController, 'destroy'])
  
  // Interactions
  router.post('/tweets/:id/like', [TweetsController, 'toggleLike'])
  
  // Édition de profil
  router.put('/profile', [ProfileController, 'update'])
}).use(middleware.auth()).prefix('/api') // Protégé par ton middleware d'authentification officiel