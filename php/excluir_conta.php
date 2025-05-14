<?php
session_start();
require_once './conexao.php';

header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Você precisa estar logado para excluir sua conta.']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];

try {
    $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
    $stmt->execute([$usuario_id]);

    session_destroy();

    echo json_encode(['status' => 'sucesso', 'mensagem' => 'Conta excluída com sucesso.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao excluir conta: ' . $e->getMessage()]);
}
?>
