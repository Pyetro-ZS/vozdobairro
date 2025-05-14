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

try {
    $sql = "
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
        JOIN usuarios u ON r.usuario_id = u.id
        ORDER BY r.data_criacao DESC
    ";

    $stmt = $pdo->query($sql);
    $relatorios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'sucesso', 'relatorios' => $relatorios]);
} catch (Exception $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao obter relatórios: ' . $e->getMessage()]);
}
?>

