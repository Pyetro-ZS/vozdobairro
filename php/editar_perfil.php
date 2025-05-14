<?php
session_start();
require_once './conexao.php';

header('Content-Type: application/json');

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Você precisa estar logado para editar o perfil.']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];
$dados = json_decode(file_get_contents("php://input"), true);
$novo_nome = htmlspecialchars($dados['nome'] ?? '', ENT_QUOTES);
$novo_email = filter_var($dados['email'] ?? '', FILTER_VALIDATE_EMAIL);

if (empty($novo_nome) || !$novo_email) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Nome ou email inválido.']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE usuarios SET nome = ?, email = ? WHERE id = ?");
    $stmt->execute([$novo_nome, $novo_email, $usuario_id]);

    $_SESSION['usuario_nome'] = $novo_nome;

    echo json_encode(['status' => 'sucesso', 'mensagem' => 'Perfil atualizado com sucesso.']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao atualizar perfil: ' . $e->getMessage()]);
}
?>
