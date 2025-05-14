<?php
// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Definir cabeçalho para JSON
header('Content-Type: application/json');

// Incluir arquivo de conexão
require_once './conexao.php';

// Verificar se o ID do relatório foi fornecido
if (!isset($_GET['id']) || empty($_GET['id'])) {
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'ID do relatório não fornecido'
    ]);
    exit;
}

$relatorioId = intval($_GET['id']);

try {
    // Consulta para obter detalhes do relatório
    $stmt = $pdo->prepare("
        SELECT 
            r.id, 
            r.tipo, 
            r.descricao, 
            r.gravidade, 
            r.status, 
            r.latitude,
            r.longitude,
            DATE_FORMAT(r.data_criacao, '%d/%m/%Y %H:%i') as data_criacao,
            u.nome as nome_usuario
        FROM relatorios r
        LEFT JOIN usuarios u ON r.usuario_id = u.id
        WHERE r.id = ?
    ");
    
    $stmt->execute([$relatorioId]);
    
    if ($stmt->rowCount() > 0) {
        $relatorio = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'status' => 'sucesso',
            'relatorio' => $relatorio
        ]);
    } else {
        echo json_encode([
            'status' => 'erro',
            'mensagem' => 'Relatório não encontrado'
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro ao obter detalhes do relatório: ' . $e->getMessage()
    ]);
}
?>