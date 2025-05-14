<?php
// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Definir cabeçalho para JSON
header('Content-Type: application/json');

// Incluir arquivo de conexão
require_once './conexao.php';

try {
    // Consulta para obter apenas os 3 relatórios mais recentes
    $stmt = $pdo->query("
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
        ORDER BY r.data_criacao DESC
        LIMIT 3
    ");
    
    $relatorios = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Retornar os relatórios como JSON
    echo json_encode([
        'status' => 'sucesso',
        'relatorios' => $relatorios
    ]);
    
} catch (Exception $e) {
    // Em caso de erro, retornar mensagem de erro
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro ao obter relatórios recentes: ' . $e->getMessage()
    ]);
}
?>