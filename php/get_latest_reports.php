<?php
require_once './conexao.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT tipo, descricao, gravidade FROM relatorios ORDER BY id DESC LIMIT 3");
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($reports);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Erro ao buscar relatórios: ' . $e->getMessage()]);
}
?>
