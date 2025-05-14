<?php
// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Adicionar log para depuração
error_log("Iniciando banco.php");

require_once './conexao.php';

try {
    // Garantir que $pdo esteja configurado corretamente
    if (!isset($pdo) || !$pdo) {
        throw new PDOException("Conexão com o banco de dados não foi estabelecida.");
    }

    // Verificar se a coluna data_cadastro existe na tabela usuarios
    $stmt = $pdo->query("SHOW COLUMNS FROM usuarios LIKE 'data_cadastro'");
    $coluna_existe = $stmt->rowCount() > 0;

    if (!$coluna_existe) {
        // Adicionar a coluna data_cadastro
        $pdo->exec("ALTER TABLE usuarios ADD COLUMN data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        echo json_encode([
            'status' => 'sucesso',
            'mensagem' => 'Coluna data_cadastro adicionada com sucesso'
        ]);
    } else {
        echo json_encode([
            'status' => 'info',
            'mensagem' => 'Coluna data_cadastro já existe'
        ]);
    }

    // Verificar se a tabela relatorios existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'relatorios'");
    $tabela_existe = $stmt->rowCount() > 0;

    if (!$tabela_existe) {
        // Criar a tabela relatorios
        $pdo->exec("
            CREATE TABLE relatorios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                tipo VARCHAR(50) NOT NULL,
                descricao TEXT NOT NULL,
                gravidade VARCHAR(20) NOT NULL,
                latitude DECIMAL(10, 8) NOT NULL,
                longitude DECIMAL(11, 8) NOT NULL,
                foto VARCHAR(255),
                status VARCHAR(20) DEFAULT 'pendente',
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )
        ");
        echo json_encode([
            'status' => 'sucesso',
            'mensagem' => 'Tabela relatorios criada com sucesso'
        ]);
    } else {
        echo json_encode([
            'status' => 'info',
            'mensagem' => 'Tabela relatorios já existe'
        ]);
    }
} catch (PDOException $e) {
    error_log("Erro PDO: " . $e->getMessage());
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro ao atualizar banco de dados: ' . $e->getMessage()
    ]);
}
?>

