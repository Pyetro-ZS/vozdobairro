// Rotas relacionadas a relatórios
import express from "express"
import {
  createReport,
  getAllReports,
  getRecentReports,
  getReportById,
  updateReportStatus,
} from "../controllers/reportController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Rota para criar um novo relatório (protegida)
router.post("/", authenticateUser, createReport)

// Rota para obter todos os relatórios
router.get("/", getAllReports)

// Rota para obter os relatórios mais recentes
router.get("/recentes", getRecentReports)

// Rota para obter um relatório específico pelo ID
router.get("/:id", getReportById)

// Rota para atualizar o status de um relatório (protegida)
router.patch("/:id/status", authenticateUser, updateReportStatus)

export default router
