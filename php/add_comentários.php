<?php
// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
  session_start();
}

// Para depuração (remover em produção)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Definir cabeçalho para JSON
header('Content-Type: application/json');

// Incluir arquivo de conexão
require_once 'conexao.php';

// Log para depuração
$log_file = fopen("comentario_log.txt", "a");
fwrite($log_file, "Requisição recebida: " . date("Y-m-d H:i:s") . "\n");
fwrite($log_file, "Método: " . $_SERVER['REQUEST_METHOD'] . "\n");
fwrite($log_file, "Sessão: " . json_encode($_SESSION) . "\n");
fwrite($log_file, "POST: " . json_encode($_POST) . "\n");

// Verificar se o usuário está logado
if (!isset($_SESSION['usuario_id'])) {
  fwrite($log_file, "Erro: Usuário não está logado\n\n");
  fclose($log_file);
  
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'Você precisa estar logado para adicionar um comentário'
  ]);
  exit;
}

// Verificar se é uma requisição POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  fwrite($log_file, "Erro: Método não permitido\n\n");
  fclose($log_file);
  
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'Método não permitido'
  ]);
  exit;
}

// Obter dados do formulário
$relatorioId = isset($_POST['relatorio_id']) ? intval($_POST['relatorio_id']) : 0;
$comentario = isset($_POST['comentario']) ? trim($_POST['comentario']) : '';

fwrite($log_file, "ID do relatório: $relatorioId\n");
fwrite($log_file, "Comentário: $comentario\n");

// Validação básica
if ($relatorioId <= 0) {
  fwrite($log_file, "Erro: ID do relatório inválido\n\n");
  fclose($log_file);
  
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'ID do relatório inválido'
  ]);
  exit;
}

if (empty($comentario)) {
  fwrite($log_file, "Erro: Comentário vazio\n\n");
  fclose($log_file);
  
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'O comentário não pode estar vazio'
  ]);
  exit;
}

try {
  // Verificar se o relatório existe
  $stmt = $pdo->prepare("SELECT id FROM relatorios WHERE id = ?");
  $stmt->execute([$relatorioId]);
  
  if ($stmt->rowCount() === 0) {
    fwrite($log_file, "Erro: Relatório não encontrado\n\n");
    fclose($log_file);
    
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Relatório não encontrado'
    ]);
    exit;
  }
  
  // Inserir o comentário
  $stmt = $pdo->prepare("
      INSERT INTO comentarios (relatorio_id, usuario_id, comentario)
      VALUES (?, ?, ?)
  ");
  
  $stmt->execute([
      $relatorioId,
      $_SESSION['usuario_id'],
      $comentario
  ]);
  
  // Obter o ID do comentário inserido
  $comentarioId = $pdo->lastInsertId();
  
  fwrite($log_file, "Comentário inserido com sucesso. ID: $comentarioId\n");
  
  // Obter os dados do comentário inserido
  $stmt = $pdo->prepare("
      SELECT 
          c.id, 
          c.comentario, 
          DATE_FORMAT(c.data_criacao, '%d/%m/%Y %H:%i') as data_criacao,
          u.nome as nome_usuario
      FROM comentarios c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ?
  ");
  
  $stmt->execute([$comentarioId]);
  $novoComentario = $stmt->fetch(PDO::FETCH_ASSOC);
  
  fwrite($log_file, "Dados do novo comentário: " . json_encode($novoComentario) . "\n\n");
  fclose($log_file);
  
  // Retornar sucesso
  echo json_encode([
      'status' => 'sucesso',
      'mensagem' => 'Comentário adicionado com sucesso',
      'comentario' => $novoComentario
  ]);
  
} catch (Exception $e) {
  fwrite($log_file, "Erro: " . $e->getMessage() . "\n\n");
  fclose($log_file);
  
  // Em caso de erro, retornar mensagem de erro
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'Erro ao adicionar comentário: ' . $e->getMessage()
  ]);
}
?>