<?php
header('Content-Type: application/json');

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');

if (empty($name) || empty($email) || empty($message)) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Todos os campos são obrigatórios.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Email inválido.']);
    exit;
}

try {
    // Salvar mensagem no banco de dados ou enviar por email
    // Aqui você pode implementar o envio de email ou salvar no banco
    echo json_encode(['status' => 'sucesso', 'mensagem' => 'Mensagem enviada com sucesso!']);
} catch (Exception $e) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao enviar mensagem: ' . $e->getMessage()]);
}
?>
