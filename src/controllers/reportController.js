// Controlador para operações relacionadas a relatórios
import { pool } from "../config/db.js"

// Criar um novo relatório
export const createReport = async (req, res) => {
  const { tipo, descricao, gravidade, latitude, longitude } = req.body
  const usuario_id = req.userId // Obtido do middleware de autenticação

  // Validação básica
  if (!tipo || !descricao || !gravidade || !latitude || !longitude) {
    const camposVazios = []
    if (!tipo) camposVazios.push("tipo")
    if (!descricao) camposVazios.push("descrição")
    if (!gravidade) camposVazios.push("gravidade")
    if (!latitude || !longitude) camposVazios.push("localização")

    const mensagem = "Os seguintes campos são obrigatórios: " + camposVazios.join(", ")

    return res.status(400).json({
      status: "erro",
      mensagem,
    })
  }

  try {
    // Inserir o relatório no banco de dados
    const [result] = await pool.query(
      `INSERT INTO relatorios 
        (usuario_id, tipo, descricao, gravidade, latitude, longitude, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pendente')`,
      [usuario_id, tipo, descricao, gravidade, latitude, longitude],
    )

    res.status(201).json({
      status: "sucesso",
      mensagem: "Relatório enviado com sucesso!",
      tipo,
      gravidade,
      id: result.insertId,
    })
  } catch (error) {
    console.error("Erro ao criar relatório:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao salvar o relatório: " + error.message,
    })
  }
}

// Obter todos os relatórios (com paginação e filtros opcionais)
export const getAllReports = async (req, res) => {
  const { pagina = 1, porPagina = 10, tipo, gravidade, status } = req.query

  // Validar parâmetros
  const page = Number.parseInt(pagina) < 1 ? 1 : Number.parseInt(pagina)
  const limit = Number.parseInt(porPagina) < 1 || Number.parseInt(porPagina) > 50 ? 10 : Number.parseInt(porPagina)
  const offset = (page - 1) * limit

  try {
    // Construir a consulta SQL base
    let sql = `
      SELECT 
        r.id,
        r.tipo, 
        r.descricao, 
        r.gravidade, 
        r.status,
        r.latitude,
        r.longitude, 
        DATE_FORMAT(r.data_criacao, '%d/%m/%Y') as data_criacao,
        u.nome as nome_usuario
      FROM relatorios r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
    `

    // Adicionar condições de filtro se fornecidas
    const conditions = []
    const params = []

    if (tipo) {
      conditions.push("r.tipo = ?")
      params.push(tipo)
    }

    if (gravidade) {
      conditions.push("r.gravidade = ?")
      params.push(gravidade)
    }

    if (status) {
      conditions.push("r.status = ?")
      params.push(status)
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ")
    }

    // Adicionar ordenação e paginação
    sql += " ORDER BY r.data_criacao DESC LIMIT ? OFFSET ?"
    params.push(limit, offset)

    // Executar a consulta
    const [reports] = await pool.query(sql, params)

    // Contar o total de relatórios (para paginação)
    let countSql = "SELECT COUNT(*) as total FROM relatorios r"

    if (conditions.length > 0) {
      countSql += " WHERE " + conditions.join(" AND ")
    }

    const [countResult] = await pool.query(countSql, params.slice(0, -2))
    const totalReports = countResult[0].total
    const totalPages = Math.ceil(totalReports / limit)

    res.status(200).json({
      status: "sucesso",
      relatorios: reports,
      paginacao: {
        total: totalReports,
        pagina_atual: page,
        total_paginas: totalPages,
        por_pagina: limit,
      },
    })
  } catch (error) {
    console.error("Erro ao obter relatórios:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao obter relatórios: " + error.message,
    })
  }
}

// Obter os relatórios mais recentes (limitado a 3)
export const getRecentReports = async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT 
        r.id, 
        r.tipo, 
        r.descricao, 
        r.gravidade, 
        r.status, 
        r.latitude,
        r.longitude,
        DATE_FORMAT(r.data_criacao, '%d/%m/%Y') as data_criacao,
        u.nome as nome_usuario
      FROM relatorios r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      ORDER BY r.data_criacao DESC
      LIMIT 3`,
    )

    res.status(200).json({
      status: "sucesso",
      relatorios: reports,
    })
  } catch (error) {
    console.error("Erro ao obter relatórios recentes:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao obter relatórios recentes: " + error.message,
    })
  }
}

// Obter um relatório específico pelo ID
export const getReportById = async (req, res) => {
  const { id } = req.params

  try {
    const [reports] = await pool.query(
      `SELECT 
        r.id, 
        r.tipo, 
        r.descricao, 
        r.gravidade, 
        r.status, 
        r.latitude,
        r.longitude,
        DATE_FORMAT(r.data_criacao, '%d/%m/%Y') as data_criacao,
        u.nome as nome_usuario
      FROM relatorios r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.id = ?`,
      [id],
    )

    if (reports.length === 0) {
      return res.status(404).json({
        status: "erro",
        mensagem: "Relatório não encontrado",
      })
    }

    res.status(200).json({
      status: "sucesso",
      relatorio: reports[0],
    })
  } catch (error) {
    console.error("Erro ao obter relatório:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao obter relatório: " + error.message,
    })
  }
}

// Atualizar o status de um relatório
export const updateReportStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  // Validação básica
  if (!status || !["pendente", "em_analise", "resolvido"].includes(status)) {
    return res.status(400).json({
      status: "erro",
      mensagem: "Status inválido. Deve ser pendente, em_analise ou resolvido.",
    })
  }

  try {
    // Verificar se o relatório existe
    const [reports] = await pool.query("SELECT id FROM relatorios WHERE id = ?", [id])

    if (reports.length === 0) {
      return res.status(404).json({
        status: "erro",
        mensagem: "Relatório não encontrado",
      })
    }

    // Atualizar o status do relatório
    await pool.query("UPDATE relatorios SET status = ? WHERE id = ?", [status, id])

    res.status(200).json({
      status: "sucesso",
      mensagem: "Status do relatório atualizado com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao atualizar status do relatório:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao atualizar status do relatório: " + error.message,
    })
  }
}
