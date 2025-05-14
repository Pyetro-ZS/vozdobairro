<?php
// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Adicionar log para depuração
error_log("Iniciando teste_cx.php");

require_once './conexao.php';

try {
    // Testar conexão com o banco de dados
    $stmt = $pdo->query("SELECT 1");
    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Conexão com o banco de dados estabelecida com sucesso',
        'session_id' => session_id(),
        'session_data' => $_SESSION
    ]);
} catch (PDOException $e) {
    error_log("Erro PDO: " . $e->getMessage());
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro ao conectar ao banco de dados: ' . $e->getMessage()
    ]);
}
?>