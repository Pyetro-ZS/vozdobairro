// Rotas relacionadas a usuários
import express from "express"
import { registerUser, loginUser, getUserProfile, checkLoginStatus } from "../controllers/userController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Rota para cadastro de usuário
router.post("/cadastro", registerUser)

// Rota para login de usuário
router.post("/login", loginUser)

// Rota para obter perfil do usuário (protegida)
router.get("/perfil", authenticateUser, getUserProfile)

// Rota para verificar status de login (protegida)
router.get("/verificar-login", authenticateUser, checkLoginStatus)

export default router
