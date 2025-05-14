<?php
// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

require_once './conexao.php';

// Verificar se o usuário está logado
if (isset($_SESSION['usuario_id'])) {
    // Buscar informações adicionais do usuário
    $stmt = $pdo->prepare("SELECT email FROM usuarios WHERE id = ?");
    $stmt->execute([$_SESSION['usuario_id']]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'logado' => true,
        'nome' => $_SESSION['usuario_nome'] ?? 'Usuário',
        'id' => $_SESSION['usuario_id'],
        'email' => $usuario['email'] ?? ''
    ]);
} else {
    echo json_encode([
        'logado' => false,
        'mensagem' => 'Você precisa fazer login para acessar todas as funcionalidades.'
    ]);
}
?>

