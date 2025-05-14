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
require_once 'conexao.php';

// Parâmetros de paginação e filtros
$pagina = isset($_GET['pagina']) ? intval($_GET['pagina']) : 1;
$porPagina = isset($_GET['por_pagina']) ? intval($_GET['por_pagina']) : 10;
$tipo = isset($_GET['tipo']) ? $_GET['tipo'] : '';
$gravidade = isset($_GET['gravidade']) ? $_GET['gravidade'] : '';
$status = isset($_GET['status']) ? $_GET['status'] : '';

// Validar parâmetros
if ($pagina < 1) $pagina = 1;
if ($porPagina < 1 || $porPagina > 50) $porPagina = 10;

// Calcular offset
$offset = ($pagina - 1) * $porPagina;

try {
  $sql = "
      SELECT 
          r.tipo, 
          r.descricao, 
          r.gravidade, 
          r.status, 
          DATE_FORMAT(r.data_criacao, '%d/%m/%Y') as data_criacao
      FROM relatorios r
      ORDER BY r.data_criacao DESC
  ";

  $stmt = $pdo->query($sql);
  $relatorios = $stmt->fetchAll(PDO::FETCH_ASSOC);

  $relatorios = array_map(function($relatorio) {
      return array_map('htmlspecialchars', $relatorio);
  }, $relatorios);

  echo json_encode([
      'relatorios' => $relatorios
  ]);
  
} catch (Exception $e) {
  // Em caso de erro, retornar mensagem de erro
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'Erro ao obter relatórios: ' . $e->getMessage()
  ]);
}
?>

