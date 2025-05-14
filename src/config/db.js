// Configuração da conexão com o banco de dados MySQL
import mysql from "mysql2/promise"
import dotenv from "dotenv"

dotenv.config()

// Criação do pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "voz_do_bairro",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Função para testar a conexão com o banco de dados
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log("Conexão com o banco de dados estabelecida com sucesso!")
    connection.release()
    return true
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error.message)
    return false
  }
}

export { pool, testConnection }
