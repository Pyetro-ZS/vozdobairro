// Rotas relacionadas a comentários
import express from "express"
import { addComment, getCommentsByReportId, deleteComment } from "../controllers/commentController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Rota para adicionar um comentário (protegida)
router.post("/", authenticateUser, addComment)

// Rota para obter comentários de um relatório
router.get("/relatorio/:relatorio_id", getCommentsByReportId)

// Rota para excluir um comentário (protegida)
router.delete("/:id", authenticateUser, deleteComment)

export default router
