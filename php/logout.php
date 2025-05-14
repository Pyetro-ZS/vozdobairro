<?php
// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Limpar todas as variáveis de sessão
$_SESSION = array();

// Destruir a sessão
session_destroy();

// Resposta de sucesso
echo json_encode([
    'status' => 'sucesso',
    'mensagem' => 'Logout realizado com sucesso!',
    'classe' => 'mensagem-sucesso'
]);
?>
