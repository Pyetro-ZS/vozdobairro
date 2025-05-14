<?php
// Iniciar sessão
if (session_status() == PHP_SESSION_NONE) {
  session_start();
}

// Habilitar exibição de erros para depuração
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Incluir arquivo de conexão
require_once 'conexao.php';

echo "<h1>Diagnóstico do Sistema de Comentários</h1>";
echo "<pre>";

// 1. Verificar conexão com o banco de dados
echo "=== Verificando conexão com o banco de dados ===\n";
try {
    $pdo->query("SELECT 1");
    echo "✓ Conexão com o banco de dados estabelecida com sucesso.\n";
    
    // Verificar versão do MySQL
    $stmt = $pdo->query("SELECT VERSION() as version");
    $version = $stmt->fetchColumn();
    echo "✓ Versão do MySQL: $version\n";
    
    // Verificar conjunto de caracteres
    $stmt = $pdo->query("SHOW VARIABLES LIKE 'character_set_database'");
    $charset = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✓ Conjunto de caracteres do banco de dados: {$charset['Value']}\n";
    
    $stmt = $pdo->query("SHOW VARIABLES LIKE 'collation_database'");
    $collation = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✓ Collation do banco de dados: {$collation['Value']}\n";
} catch (PDOException $e) {
    echo "✗ Erro na conexão com o banco de dados: " . $e->getMessage() . "\n";
    die("</pre>");
}

// 2. Verificar estrutura das tabelas
echo "\n=== Verificando estrutura das tabelas ===\n";

// Verificar tabela de usuários
try {
    $stmt = $pdo->query("DESCRIBE usuarios");
    $colunas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "✓ Tabela 'usuarios' existe e contém " . count($colunas) . " colunas.\n";
    
    // Verificar quantidade de registros
    $stmt = $pdo->query("SELECT COUNT(*) FROM usuarios");
    $count = $stmt->fetchColumn();
    echo "  - Registros na tabela 'usuarios': $count\n";
} catch (PDOException $e) {
    echo "✗ Erro ao verificar tabela 'usuarios': " . $e->getMessage() . "\n";
}

// Verificar tabela de relatórios
try {
    $stmt = $pdo->query("DESCRIBE relatorios");
    $colunas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "✓ Tabela 'relatorios' existe e contém " . count($colunas) . " colunas.\n";
    
    // Verificar quantidade de registros
    $stmt = $pdo->query("SELECT COUNT(*) FROM relatorios");
    $count = $stmt->fetchColumn();
    echo "  - Registros na tabela 'relatorios': $count\n";
} catch (PDOException $e) {
    echo "✗ Erro ao verificar tabela 'relatorios': " . $e->getMessage() . "\n";
}

// Verificar tabela de comentários
try {
    $stmt = $pdo->query("DESCRIBE comentarios");
    $colunas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "✓ Tabela 'comentarios' existe e contém " . count($colunas) . " colunas.\n";
    
    // Verificar quantidade de registros
    $stmt = $pdo->query("SELECT COUNT(*) FROM comentarios");
    $count = $stmt->fetchColumn();
    echo "  - Registros na tabela 'comentarios': $count\n";
    
    // Verificar chaves estrangeiras
    $stmt = $pdo->query("
        SELECT 
            TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM
            INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE
            TABLE_NAME = 'comentarios' AND
            REFERENCED_TABLE_NAME IS NOT NULL
    ");
    $fks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($fks) >= 2) {
        echo "✓ Chaves estrangeiras da tabela 'comentarios' estão corretas.\n";
        foreach ($fks as $fk) {
            echo "  - {$fk['CONSTRAINT_NAME']}: {$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']}({$fk['REFERENCED_COLUMN_NAME']})\n";
        }
    } else {
        echo "✗ Chaves estrangeiras da tabela 'comentarios' estão incompletas ou ausentes.\n";
    }
} catch (PDOException $e) {
    echo "✗ Erro ao verificar tabela 'comentarios': " . $e->getMessage() . "\n";
}

// 3. Verificar sessão do usuário
echo "\n=== Verificando sessão do usuário ===\n";
if (isset($_SESSION['usuario_id'])) {
    echo "✓ Usuário está logado na sessão PHP (ID: {$_SESSION['usuario_id']}).\n";
    
    // Verificar se o usuário existe no banco de dados
    try {
        $stmt = $pdo->prepare("SELECT id, nome, email FROM usuarios WHERE id = ?");
        $stmt->execute([$_SESSION['usuario_id']]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($usuario) {
            echo "✓ Usuário existe no banco de dados.\n";
            echo "  - Nome: {$usuario['nome']}\n";
            echo "  - Email: {$usuario['email']}\n";
        } else {
            echo "✗ ATENÇÃO: O usuário com ID {$_SESSION['usuario_id']} não existe no banco de dados!\n";
        }
    } catch (PDOException $e) {
        echo "✗ Erro ao verificar usuário no banco de dados: " . $e->getMessage() . "\n";
    }
} else {
    echo "✗ Usuário NÃO está logado na sessão PHP.\n";
}

// 4. Testar inserção de comentário
echo "\n=== Testando inserção de comentário ===\n";

// Verificar se há relatórios para teste
try {
    $stmt = $pdo->query("SELECT id, tipo FROM relatorios ORDER BY id LIMIT 1");
    $relatorio = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($relatorio) {
        echo "✓ Relatório encontrado para teste (ID: {$relatorio['id']}, Tipo: {$relatorio['tipo']}).\n";
        
        // Verificar se o usuário está logado
        if (isset($_SESSION['usuario_id'])) {
            $usuario_id = $_SESSION['usuario_id'];
            $relatorio_id = $relatorio['id'];
            $comentario_teste = "Comentário de teste gerado pelo diagnóstico em " . date('Y-m-d H:i:s');
            
            echo "  - Tentando inserir comentário de teste...\n";
            
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO comentarios (relatorio_id, usuario_id, comentario)
                    VALUES (?, ?, ?)
                ");
                
                $resultado = $stmt->execute([
                    $relatorio_id,
                    $usuario_id,
                    $comentario_teste
                ]);
                
                if ($resultado) {
                    $comentario_id = $pdo->lastInsertId();
                    echo "✓ Comentário de teste inserido com sucesso (ID: $comentario_id).\n";
                    
                    // Verificar se o comentário foi realmente inserido
                    $stmt = $pdo->prepare("SELECT id, comentario FROM comentarios WHERE id = ?");
                    $stmt->execute([$comentario_id]);
                    $comentario_verificado = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($comentario_verificado) {
                        echo "✓ Comentário verificado no banco de dados.\n";
                        
                        // Remover o comentário de teste
                        $stmt = $pdo->prepare("DELETE FROM comentarios WHERE id = ?");
                        $stmt->execute([$comentario_id]);
                        echo "✓ Comentário de teste removido.\n";
                    } else {
                        echo "✗ Não foi possível verificar o comentário no banco de dados.\n";
                    }
                } else {
                    echo "✗ Falha ao inserir comentário de teste.\n";
                    echo "  - Erro: " . implode(", ", $stmt->errorInfo()) . "\n";
                }
            } catch (PDOException $e) {
                echo "✗ Exceção ao inserir comentário: " . $e->getMessage() . "\n";
            }
        } else {
            echo "✗ Não é possível testar a inserção de comentário sem um usuário logado.\n";
        }
    } else {
        echo "✗ Nenhum relatório encontrado para teste.\n";
    }
} catch (PDOException $e) {
    echo "✗ Erro ao buscar relatório para teste: " . $e->getMessage() . "\n";
}

// 5. Verificar arquivos PHP
echo "\n=== Verificando arquivos PHP ===\n";

$arquivos = [
    'add_comentário.php',
    'ob_comentários.php',
    'conexao.php'
];

foreach ($arquivos as $arquivo) {
    $caminho = $arquivo;
    if (file_exists($caminho)) {
        echo "✓ Arquivo '$arquivo' existe.\n";
        
        // Verificar permissões
        $perms = fileperms($caminho);
        $perms_str = substr(sprintf('%o', $perms), -4);
        echo "  - Permissões: $perms_str\n";
        
        // Verificar tamanho
        $tamanho = filesize($caminho);
        echo "  - Tamanho: $tamanho bytes\n";
    } else {
        echo "✗ Arquivo '$arquivo' não encontrado.\n";
    }
}

// 6. Verificar configurações do PHP
echo "\n=== Verificando configurações do PHP ===\n";
echo "✓ Versão do PHP: " . phpversion() . "\n";
echo "✓ PDO habilitado: " . (extension_loaded('pdo') ? 'Sim' : 'Não') . "\n";
echo "✓ PDO MySQL habilitado: " . (extension_loaded('pdo_mysql') ? 'Sim' : 'Não') . "\n";
echo "✓ Limite de upload: " . ini_get('upload_max_filesize') . "\n";
echo "✓ Limite de POST: " . ini_get('post_max_size') . "\n";
echo "✓ Tempo máximo de execução: " . ini_get('max_execution_time') . " segundos\n";

// 7. Recomendações
echo "\n=== Recomendações ===\n";

// Verificar se há problemas com a sessão
if (!isset($_SESSION['usuario_id'])) {
    echo "! Faça login antes de tentar adicionar comentários.\n";
}

// Verificar se há problemas com o conjunto de caracteres
if (isset($charset) && $charset['Value'] != 'utf8mb4') {
    echo "! Considere alterar o conjunto de caracteres do banco de dados para utf8mb4.\n";
}

// Verificar se há relatórios
if (!isset($relatorio) || !$relatorio) {
    echo "! Crie pelo menos um relatório antes de tentar adicionar comentários.\n";
}

echo "</pre>";

// Botão para corrigir problemas
echo "<h2>Corrigir Problemas</h2>";
echo "<form method='post' action='corrigir_problemas.php'>";
echo "<button type='submit'>Corrigir Problemas Automaticamente</button>";
echo "</form>";

// Link para voltar
echo '<p><a href="javascript:history.back()">Voltar</a></p>';
?>