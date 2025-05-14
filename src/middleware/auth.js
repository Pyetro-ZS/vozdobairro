// Middleware de autenticação
import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || "vozdoBairroSecretKey"

// Middleware para verificar se o usuário está autenticado
export const authenticateUser = (req, res, next) => {
  // Obter o token do cabeçalho Authorization
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({
      status: "erro",
      mensagem: "Acesso não autorizado. Token não fornecido.",
    })
  }

  // O formato esperado é "Bearer [token]"
  const parts = authHeader.split(" ")

  if (parts.length !== 2) {
    return res.status(401).json({
      status: "erro",
      mensagem: "Erro no formato do token.",
    })
  }

  const [scheme, token] = parts

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({
      status: "erro",
      mensagem: "Token mal formatado.",
    })
  }

  // Verificar se o token é válido
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: "erro",
        mensagem: "Token inválido ou expirado.",
      })
    }

    // Adicionar o ID do usuário decodificado à requisição
    req.userId = decoded.id
    return next()
  })
}

// Função para gerar um token JWT
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: "7d", // Token válido por 7 dias
  })
}
