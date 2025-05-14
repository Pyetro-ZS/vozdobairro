// Arquivo principal do servidor
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { testConnection } from "./config/db.js"
import userRoutes from "./routes/userRoutes.js"
import reportRoutes from "./routes/reportRoutes.js"
import commentRoutes from "./routes/commentRoutes.js"

// Configurar variáveis de ambiente
dotenv.config()

// Criar aplicação Express
const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Testar conexão com o banco de dados
testConnection()

// Rotas
app.use("/api/usuarios", userRoutes)
app.use("/api/relatorios", reportRoutes)
app.use("/api/comentarios", commentRoutes)

// Rota raiz
app.get("/", (req, res) => {
  res.json({
    mensagem: "API Voz do Bairro funcionando!",
    versao: "1.0.0",
  })
})

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    status: "erro",
    mensagem: "Erro interno do servidor",
  })
})

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})

export default app
