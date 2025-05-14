// Controlador para operações relacionadas a comentários
import { pool } from "../config/db.js"

// Adicionar um comentário a um relatório
export const addComment = async (req, res) => {
  const { relatorio_id, comentario } = req.body
  const usuario_id = req.userId // Obtido do middleware de autenticação

  // Validação básica
  if (!relatorio_id || !comentario) {
    return res.status(400).json({
      status: "erro",
      mensagem: "ID do relatório e comentário são obrigatórios",
    })
  }

  try {
    // Verificar se o relatório existe
    const [reports] = await pool.query("SELECT id FROM relatorios WHERE id = ?", [relatorio_id])

    if (reports.length === 0) {
      return res.status(404).json({
        status: "erro",
        mensagem: "Relatório não encontrado",
      })
    }

    // Inserir o comentário no banco de dados
    const [result] = await pool.query(
      "INSERT INTO comentarios (relatorio_id, usuario_id, comentario) VALUES (?, ?, ?)",
      [relatorio_id, usuario_id, comentario],
    )

    res.status(201).json({
      status: "sucesso",
      mensagem: "Comentário adicionado com sucesso!",
      id: result.insertId,
    })
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao adicionar comentário: " + error.message,
    })
  }
}

// Obter comentários de um relatório
export const getCommentsByReportId = async (req, res) => {
  const { relatorio_id } = req.params

  try {
    // Verificar se o relatório existe
    const [reports] = await pool.query("SELECT id FROM relatorios WHERE id = ?", [relatorio_id])

    if (reports.length === 0) {
      return res.status(404).json({
        status: "erro",
        mensagem: "Relatório não encontrado",
      })
    }

    // Buscar comentários do relatório
    const [comments] = await pool.query(
      `SELECT 
        c.id, 
        c.comentario, 
        DATE_FORMAT(c.data_criacao, '%d/%m/%Y %H:%i') as data_criacao,
        u.nome as nome_usuario
      FROM comentarios c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.relatorio_id = ?
      ORDER BY c.data_criacao ASC`,
      [relatorio_id],
    )

    res.status(200).json({
      status: "sucesso",
      comentarios: comments,
    })
  } catch (error) {
    console.error("Erro ao obter comentários:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao obter comentários: " + error.message,
    })
  }
}

// Excluir um comentário
export const deleteComment = async (req, res) => {
  const { id } = req.params
  const usuario_id = req.userId // Obtido do middleware de autenticação

  try {
    // Verificar se o comentário existe e pertence ao usuário
    const [comments] = await pool.query("SELECT id, usuario_id FROM comentarios WHERE id = ?", [id])

    if (comments.length === 0) {
      return res.status(404).json({
        status: "erro",
        mensagem: "Comentário não encontrado",
      })
    }

    // Verificar se o usuário é o autor do comentário
    if (comments[0].usuario_id !== usuario_id) {
      return res.status(403).json({
        status: "erro",
        mensagem: "Você não tem permissão para excluir este comentário",
      })
    }

    // Excluir o comentário
    await pool.query("DELETE FROM comentarios WHERE id = ?", [id])

    res.status(200).json({
      status: "sucesso",
      mensagem: "Comentário excluído com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao excluir comentário:", error)
    res.status(500).json({
      status: "erro",
      mensagem: "Erro ao excluir comentário: " + error.message,
    })
  }
}
