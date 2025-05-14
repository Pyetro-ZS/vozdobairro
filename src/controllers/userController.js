// Controlador para operações relacionadas a usuários
import bcrypt from "bcrypt"
import { pool } from "../config/db.js"
import { generateToken } from "../middleware/auth.js"

// Cadastrar um novo usuário
export const registerUser = async (req, res) => {
  const { nome, email, senha } = req.body

  // Validação básica
  if (!nome || !email || !senha) {
    return res.status(400).json({
      status: "erro",
      mensagem: "Todos os campos são obrigatórios",
      classe: "mensagem-erro",
    })
  }

  if (senha.length < 8) {
    return res.status(400).json({
      status: "erro",
      mensagem: "A senha deve ter pelo menos 8 caracteres",
      classe: "mensagem-erro",
    })
  }

  try {
    // Verificar se o email já existe
    const [existingUsers] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email])

    if (existingUsers.length > 0) {
      return res.status(400).json({
        status: "erro",
        mensagem: "Este email já está cadastrado",
        classe: "mensagem-erro",
      })
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(senha, salt)

    // Inserir o novo usuário no banco de dados
    const [result] = await pool.query("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)", [
      nome,
      email,
      hashedPassword,
    ])

    // Gerar token JWT
    const token = generateToken(result.insertId)

    res.status(201).json({
      status: "sucesso",
      mensagem: "Cadastro realizado com sucesso!",
      classe: "mensagem-sucesso",
      usuario: {
        id: result.insertId,
        nome,
        email,
      },
      token,
    })
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao cadastrar usuário: " + error.message,
      classe: "mensagem-erro",
    })
  }
}

// Login de usuário
export const loginUser = async (req, res) => {
  const { email, senha } = req.body

  // Validação básica
  if (!email || !senha) {
    return res.status(400).json({
      status: "erro",
      mensagem: "Email e senha são obrigatórios",
      classe: "mensagem-erro",
    })
  }

  try {
    // Buscar usuário pelo email
    const [users] = await pool.query("SELECT id, nome, email, senha FROM usuarios WHERE email = ?", [email])

    if (users.length === 0) {
      return res.status(401).json({
        status: "erro",
        mensagem: "Credenciais inválidas",
        classe: "mensagem-erro",
      })
    }

    const user = users[0]

    // Verificar a senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha)

    if (!isPasswordValid) {
      return res.status(401).json({
        status: "erro",
        mensagem: "Credenciais inválidas",
        classe: "mensagem-erro",
      })
    }

    // Gerar token JWT
    const token = generateToken(user.id)

    res.status(200).json({
      status: "sucesso",
      mensagem: "Login realizado com sucesso!",
      classe: "mensagem-sucesso",
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
      token,
    })
  } catch (error) {
    console.error("Erro ao fazer login:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao fazer login: " + error.message,
      classe: "mensagem-erro",
    })
  }
}

// Obter perfil do usuário
export const getUserProfile = async (req, res) => {
  try {
    // Obter ID do usuário do middleware de autenticação
    const userId = req.userId

    // Buscar dados do usuário
    const [users] = await pool.query(
      'SELECT id, nome, email, DATE_FORMAT(data_cadastro, "%d/%m/%Y") as data_cadastro FROM usuarios WHERE id = ?',
      [userId],
    )

    if (users.length === 0) {
      return res.status(404).json({
        status: "erro",
        mensagem: "Usuário não encontrado",
        classe: "mensagem-erro",
      })
    }

    const user = users[0]

    // Buscar relatórios do usuário
    const [reports] = await pool.query(
      `SELECT 
        tipo, 
        descricao, 
        gravidade, 
        status, 
        DATE_FORMAT(data_criacao, '%d/%m/%Y') as data_criacao 
      FROM relatorios 
      WHERE usuario_id = ? 
      ORDER BY data_criacao DESC`,
      [userId],
    )

    // Adicionar relatórios aos dados do usuário
    user.relatorios = reports

    res.status(200).json({
      status: "sucesso",
      classe: "mensagem-sucesso",
      usuario: user,
    })
  } catch (error) {
    console.error("Erro ao obter perfil do usuário:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao obter dados do perfil: " + error.message,
      classe: "mensagem-erro",
    })
  }
}

// Verificar status de login
export const checkLoginStatus = async (req, res) => {
  try {
    // Obter ID do usuário do middleware de autenticação
    const userId = req.userId

    // Buscar dados do usuário
    const [users] = await pool.query("SELECT email FROM usuarios WHERE id = ?", [userId])

    if (users.length === 0) {
      return res.status(404).json({
        status: "erro",
        mensagem: "Usuário não encontrado",
        classe: "mensagem-erro",
      })
    }

    // Buscar nome do usuário
    const [userNames] = await pool.query("SELECT nome FROM usuarios WHERE id = ?", [userId])

    const userName = userNames.length > 0 ? userNames[0].nome : "Usuário"

    res.status(200).json({
      logado: true,
      nome: userName,
      id: userId,
      email: users[0].email,
    })
  } catch (error) {
    console.error("Erro ao verificar status de login:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao verificar status de login: " + error.message,
      classe: "mensagem-erro",
    })
  }
}
