<?php
// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
  session_start();
}

// Desativar exibição de erros
ini_set('display_errors', 0);
error_reporting(0);

// Definir cabeçalho para JSON
header('Content-Type: application/json');

// Incluir arquivo de conexão
require_once './conexao.php';

// Verificar se o ID do relatório foi fornecido
if (!isset($_GET['relatorio_id']) || empty($_GET['relatorio_id'])) {
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'ID do relatório não fornecido'
  ]);
  exit;
}

$relatorioId = intval($_GET['relatorio_id']);

try {
  // Consultar comentários do relatório
  $stmt = $pdo->prepare("
      SELECT 
          c.id, 
          c.comentario, 
          DATE_FORMAT(c.data_criacao, '%d/%m/%Y %H:%i') as data_criacao,
          u.nome as nome_usuario
      FROM comentarios c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.relatorio_id = ?
      ORDER BY c.data_criacao DESC
  ");
  
  $stmt->execute([$relatorioId]);
  $comentarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
  
  // Retornar os comentários como JSON
  echo json_encode([
      'status' => 'sucesso',
      'comentarios' => $comentarios
  ]);
  
} catch (Exception $e) {
  // Em caso de erro, retornar mensagem de erro
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'Erro ao obter comentários: ' . $e->getMessage()
  ]);
}
?>