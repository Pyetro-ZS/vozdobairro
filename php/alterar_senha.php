<?php
session_start();
require_once './conexao.php';

header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Você precisa estar logado para alterar a senha.']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];
$dados = json_decode(file_get_contents("php://input"), true);
$nova_senha = $dados['senha'] ?? '';

if (empty($nova_senha) || strlen($nova_senha) < 8) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'A senha deve ter pelo menos 8 caracteres.']);
    exit;
}

try {
    $senha_hash = password_hash($nova_senha, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE usuarios SET senha = ? WHERE id = ?");
    $stmt->execute([$senha_hash, $usuario_id]);

    echo json_encode(['status' => 'sucesso', 'mensagem' => 'Senha alterada com sucesso.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao alterar senha: ' . $e->getMessage()]);
}
?>
