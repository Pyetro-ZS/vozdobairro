<?php
// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Adicionar log para depuração
error_log("Iniciando perfil.php");

require_once './conexao.php';

// Verificar se o usuário está logado
if (!isset($_SESSION['usuario_id'])) {
    error_log("Usuário não está logado");
    echo json_encode([
        'status' => 'erro',
        'classe' => 'mensagem-erro',
        'mensagem' => 'Usuário não está logado'
    ]);
    exit;
}

// Obter ID do usuário da sessão
$usuarioId = $_SESSION['usuario_id'];
error_log("ID do usuário: " . $usuarioId);

try {
    // Consultar dados do usuário
    $stmt = $pdo->prepare("SELECT id, nome, email, DATE_FORMAT(data_cadastro, '%d/%m/%Y') as data_cadastro FROM usuarios WHERE id = ?");
    $stmt->execute([$usuarioId]);
    
    if ($stmt->rowCount() > 0) {
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        error_log("Dados do usuário encontrados: " . json_encode($usuario));
        
        // Consultar relatórios do usuário
        $stmtRelatorios = $pdo->prepare("
            SELECT 
                tipo, 
                descricao, 
                gravidade, 
                status, 
                DATE_FORMAT(data_criacao, '%d/%m/%Y') as data_criacao 
            FROM relatorios 
            WHERE usuario_id = ? 
            ORDER BY data_criacao DESC
        ");
        $stmtRelatorios->execute([$usuarioId]);
        $relatorios = $stmtRelatorios->fetchAll(PDO::FETCH_ASSOC);
        
        // Adicionar relatórios aos dados do usuário
        $usuario = array_map('htmlspecialchars', $usuario);
        $relatorios = array_map(function($relatorio) {
            return array_map('htmlspecialchars', $relatorio);
        }, $relatorios);
        $usuario['relatorios'] = $relatorios;
        
        echo json_encode([
            'status' => 'sucesso',
            'classe' => 'mensagem-sucesso',
            'usuario' => $usuario
        ]);
    } else {
        error_log("Usuário não encontrado no banco de dados");
        echo json_encode([
            'status' => 'erro',
            'classe' => 'mensagem-erro',
            'mensagem' => 'Usuário não encontrado'
        ]);
    }
} catch (PDOException $e) {
    error_log("Erro PDO: " . $e->getMessage());
    echo json_encode([
        'status' => 'erro',
        'classe' => 'mensagem-erro',
        'mensagem' => 'Erro ao obter dados do perfil: ' . $e->getMessage()
    ]);
}
?>

