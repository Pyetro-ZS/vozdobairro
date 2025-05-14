<?php
session_start();
require_once './conexao.php';

header('Content-Type: application/json');

// Adicionar log para depuração
error_log("Requisição recebida: " . print_r($_POST, true));

if (!isset($_SESSION['usuario_id'])) {
    echo json_encode(['status' => 'erro', 'mensagem' => 'Você precisa estar logado para enviar um relatório.']);
    exit;
}

$usuario_id = $_SESSION['usuario_id'];
$tipo = $_POST['issue-type'] ?? '';


// Caso contrário, manter o tipo original (pothole, damaged_sidewalk, etc.)

$descricao = $_POST['descricao'] ?? ''; // Não usar htmlspecialchars_decode aqui
$gravidade = $_POST['issue-severity'] ?? '';
$latitude = $_POST['latitude'] ?? null;
$longitude = $_POST['longitude'] ?? null;

// Adicionar log para depuração
error_log("Dados processados: tipo=$tipo, descricao=$descricao, gravidade=$gravidade, lat=$latitude, long=$longitude");

if (empty($tipo) || empty($descricao) || empty($gravidade) || empty($latitude) || empty($longitude)) {
    $campos_vazios = [];
    if (empty($tipo)) $campos_vazios[] = 'tipo';
    if (empty($descricao)) $campos_vazios[] = 'descrição';
    if (empty($gravidade)) $campos_vazios[] = 'gravidade';
    if (empty($latitude) || empty($longitude)) $campos_vazios[] = 'localização';
    
    $mensagem = 'Os seguintes campos são obrigatórios: ' . implode(', ', $campos_vazios);
    echo json_encode(['status' => 'erro', 'mensagem' => $mensagem]);
    exit;
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO relatorios (usuario_id, tipo, descricao, gravidade, latitude, longitude, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pendente')
    ");
    $stmt->execute([$usuario_id, $tipo, $descricao, $gravidade, $latitude, $longitude]);

    echo json_encode(['status' => 'sucesso', 'mensagem' => 'Relatório enviado com sucesso!', 'tipo' => $tipo, 'gravidade' => $gravidade]);
} catch (PDOException $e) {
    error_log("Erro PDO: " . $e->getMessage());
    echo json_encode(['status' => 'erro', 'mensagem' => 'Erro ao salvar o relatório: ' . $e->getMessage()]);
}
?>
