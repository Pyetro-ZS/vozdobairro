<?php
session_start();
require_once './conexao.php';

try {
    // Verificar se já existem relatórios
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM relatorios");
    $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($resultado['total'] > 0) {
        echo "Já existem relatórios no banco de dados.";
        exit;
    }
    
    // Obter um usuário para associar aos relatórios
    $stmt = $pdo->query("SELECT id FROM usuarios LIMIT 1");
    if ($stmt->rowCount() == 0) {
        echo "Nenhum usuário encontrado.";
        exit;
    }
    
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    $usuarioId = $usuario['id'];
    
    // Inserir relatórios
    $stmt = $pdo->prepare("
        INSERT INTO relatorios 
        (usuario_id, tipo, descricao, gravidade, latitude, longitude, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $contador = 0;
    foreach ($relatorios as $relatorio) {
        $stmt->execute([
            $usuarioId,
            $relatorio['tipo'],
            $relatorio['descricao'],
            $relatorio['gravidade'],
            $relatorio['latitude'],
            $relatorio['longitude'],
            $relatorio['status']
        ]);
        
        $contador++;
    }
    
    echo $contador . " relatórios inseridos com sucesso.";
    
} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage();
}
?>

