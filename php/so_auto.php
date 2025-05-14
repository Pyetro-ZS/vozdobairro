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

echo "<h1>Correção Automática de Problemas</h1>";
echo "<pre>";

// 1. Corrigir conjunto de caracteres do banco de dados
echo "=== Corrigindo conjunto de caracteres ===\n";
try {
    // Obter o nome do banco de dados atual
    $stmt = $pdo->query("SELECT DATABASE()");
    $banco = $stmt->fetchColumn();
    
    // Alterar conjunto de caracteres do banco de dados
    $pdo->exec("ALTER DATABASE `$banco` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "✓ Conjunto de caracteres do banco de dados alterado para utf8mb4.\n";
    
    // Alterar conjunto de caracteres das tabelas
    $tabelas = ['usuarios', 'relatorios', 'comentarios'];
    foreach ($tabelas as $tabela) {
        $pdo->exec("ALTER TABLE `$tabela` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "✓ Conjunto de caracteres da tabela '$tabela' alterado para utf8mb4.\n";
    }
} catch (PDOException $e) {
    echo "✗ Erro ao alterar conjunto de caracteres: " . $e->getMessage() . "\n";
}

// 2. Verificar e corrigir chaves estrangeiras
echo "\n=== Verificando e corrigindo chaves estrangeiras ===\n";
try {
    // Verificar chaves estrangeiras existentes
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
    
    // Se houver menos de 2 chaves estrangeiras, recriar
    if (count($fks) < 2) {
        echo "! Chaves estrangeiras incompletas. Recriando...\n";
        
        // Remover chaves estrangeiras existentes
        foreach ($fks as $fk) {
            $pdo->exec("ALTER TABLE comentarios DROP FOREIGN KEY {$fk['CONSTRAINT_NAME']}");
            echo "✓ Chave estrangeira '{$fk['CONSTRAINT_NAME']}' removida.\n";
        }
        
        // Adicionar chaves estrangeiras
        $pdo->exec("
            ALTER TABLE comentarios
            ADD CONSTRAINT fk_comentarios_relatorio
            FOREIGN KEY (relatorio_id) REFERENCES relatorios(id) ON DELETE CASCADE
        ");
        echo "✓ Chave estrangeira para 'relatorio_id' criada.\n";
        
        $pdo->exec("
            ALTER TABLE comentarios
            ADD CONSTRAINT fk_comentarios_usuario
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        ");
        echo "✓ Chave estrangeira para 'usuario_id' criada.\n";
    } else {
        echo "✓ Chaves estrangeiras já estão corretas.\n";
    }
} catch (PDOException $e) {
    echo "✗ Erro ao corrigir chaves estrangeiras: " . $e->getMessage() . "\n";
}

// 3. Verificar e corrigir índices
echo "\n=== Verificando e corrigindo índices ===\n";
try {
    // Verificar índice para relatorio_id
    $stmt = $pdo->query("SHOW INDEX FROM comentarios WHERE Key_name = 'idx_relatorio_id'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("CREATE INDEX idx_relatorio_id ON comentarios(relatorio_id)");
        echo "✓ Índice 'idx_relatorio_id' criado.\n";
    } else {
        echo "✓ Índice 'idx_relatorio_id' já existe.\n";
    }
    
    // Verificar índice para usuario_id
    $stmt = $pdo->query("SHOW INDEX FROM comentarios WHERE Key_name = 'idx_usuario_id'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("CREATE INDEX idx_usuario_id ON comentarios(usuario_id)");
        echo "✓ Índice 'idx_usuario_id' criado.\n";
    } else {
        echo "✓ Índice 'idx_usuario_id' já existe.\n";
    }
} catch (PDOException $e) {
    echo "✗ Erro ao corrigir índices: " . $e->getMessage() . "\n";
}

// 4. Verificar e corrigir arquivo de conexão
echo "\n=== Verificando e corrigindo arquivo de conexão ===\n";
$conexao_file = 'conexao.php';
$conexao_content = <<<EOT
<?php
// Configurações do banco de dados
\$host = 'localhost';
\$dbname = 'voz_do_bairro';
\$username = 'root'; // Substitua pelo seu usuário do banco de dados
\$password = ''; // Substitua pela sua senha do banco de dados

try {
    // Criar conexão PDO com configurações adequadas
    \$pdo = new PDO(
        "mysql:host=\$host;dbname=\$dbname;charset=utf8mb4",
        \$username,
        \$password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
        ]
    );
} catch (PDOException \$e) {
    // Em ambiente de produção, não exibir detalhes do erro
    die("Erro de conexão com o banco de dados. Por favor, tente novamente mais tarde.");
    
    // Para depuração (descomente se necessário)
    // die("Erro de conexão: " . \$e->getMessage());
}
?>
EOT;

if (file_exists($conexao_file)) {
    $current_content = file_get_contents($conexao_file);
    
    // Verificar se o arquivo já contém as configurações corretas
    if (strpos($current_content, 'charset=utf8mb4') === false || 
        strpos($current_content, 'PDO::ATTR_EMULATE_PREPARES') === false) {
        
        // Fazer backup do arquivo atual
        $backup_file = $conexao_file . '.bak.' . time();
        file_put_contents($backup_file, $current_content);
        echo "✓ Backup do arquivo de conexão criado: $backup_file\n";
        
        // Atualizar o arquivo
        file_put_contents($conexao_file, $conexao_content);
        echo "✓ Arquivo de conexão atualizado com configurações corretas.\n";
    } else {
        echo "✓ Arquivo de conexão já contém as configurações corretas.\n";
    }
} else {
    // Criar o arquivo
    file_put_contents($conexao_file, $conexao_content);
    echo "✓ Arquivo de conexão criado.\n";
}

// 5. Verificar e corrigir arquivos PHP de comentários
echo "\n=== Verificando e corrigindo arquivos PHP de comentários ===\n";

// Arquivo add_comentário.php
$add_comentario_file = 'add_comentário.php';
$add_comentario_content = <<<EOT
<?php
// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
  session_start();
}

// Definir cabeçalho para JSON
header('Content-Type: application/json');

// Incluir arquivo de conexão
require_once 'conexao.php';

// Verificar se o usuário está logado
if (!isset(\$_SESSION['usuario_id'])) {
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'Você precisa estar logado para adicionar um comentário'
  ]);
  exit;
}

// Verificar se é uma requisição POST
if (\$_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'Método não permitido'
  ]);
  exit;
}

// Obter dados do formulário
\$relatorioId = isset(\$_POST['relatorio_id']) ? intval(\$_POST['relatorio_id']) : 0;
\$comentario = isset(\$_POST['comentario']) ? trim(\$_POST['comentario']) : '';

// Validação básica
if (\$relatorioId <= 0) {
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'ID do relatório inválido'
  ]);
  exit;
}

if (empty(\$comentario)) {
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'O comentário não pode estar vazio'
  ]);
  exit;
}

try {
  // Verificar se o relatório existe
  \$stmt = \$pdo->prepare("SELECT id FROM relatorios WHERE id = ?");
  \$stmt->execute([\$relatorioId]);
  
  if (\$stmt->rowCount() === 0) {
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Relatório não encontrado'
    ]);
    exit;
  }
  
  // Inserir o comentário
  \$stmt = \$pdo->prepare("
      INSERT INTO comentarios (relatorio_id, usuario_id, comentario)
      VALUES (?, ?, ?)
  ");
  
  \$resultado = \$stmt->execute([
      \$relatorioId,
      \$_SESSION['usuario_id'],
      \$comentario
  ]);
  
  if (!\$resultado) {
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Erro ao inserir comentário no banco de dados'
    ]);
    exit;
  }
  
  // Obter o ID do comentário inserido
  \$comentarioId = \$pdo->lastInsertId();
  
  // Obter os dados do comentário inserido
  \$stmt = \$pdo->prepare("
      SELECT 
          c.id, 
          c.comentario, 
          DATE_FORMAT(c.data_criacao, '%d/%m/%Y %H:%i') as data_criacao,
          u.nome as nome_usuario
      FROM comentarios c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ?
  ");
  
  \$stmt->execute([\$comentarioId]);
  \$novoComentario = \$stmt->fetch(PDO::FETCH_ASSOC);
  
  if (!\$novoComentario) {
    echo json_encode([
        'status' => 'sucesso',
        'mensagem' => 'Comentário adicionado com sucesso, mas não foi possível recuperar os detalhes'
    ]);
    exit;
  }
  
  // Retornar sucesso
  echo json_encode([
      'status' => 'sucesso',
      'mensagem' => 'Comentário adicionado com sucesso',
      'comentario' => \$novoComentario
  ]);
  
} catch (PDOException \$e) {
  // Em caso de erro, retornar mensagem de erro
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'Erro ao adicionar comentário: ' . \$e->getMessage()
  ]);
}
?>
EOT;

if (file_exists($add_comentario_file)) {
    $current_content = file_get_contents($add_comentario_file);
    
    // Fazer backup do arquivo atual
    $backup_file = $add_comentario_file . '.bak.' . time();
    file_put_contents($backup_file, $current_content);
    echo "✓ Backup do arquivo add_comentário.php criado: $backup_file\n";
    
    // Atualizar o arquivo
    file_put_contents($add_comentario_file, $add_comentario_content);
    echo "✓ Arquivo add_comentário.php atualizado.\n";
} else {
    // Criar o arquivo
    file_put_contents($add_comentario_file, $add_comentario_content);
    echo "✓ Arquivo add_comentário.php criado.\n";
}

// Arquivo ob_comentários.php
$ob_comentarios_file = 'ob_comentários.php';
$ob_comentarios_content = <<<EOT
<?php
// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
  session_start();
}

// Definir cabeçalho para JSON
header('Content-Type: application/json');

// Incluir arquivo de conexão
require_once 'conexao.php';

// Verificar se o ID do relatório foi fornecido
if (!isset(\$_GET['relatorio_id']) || empty(\$_GET['relatorio_id'])) {
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'ID do relatório não fornecido'
  ]);
  exit;
}

\$relatorioId = intval(\$_GET['relatorio_id']);

try {
  // Verificar se o relatório existe
  \$stmt = \$pdo->prepare("SELECT id FROM relatorios WHERE id = ?");
  \$stmt->execute([\$relatorioId]);
  
  if (\$stmt->rowCount() === 0) {
    echo json_encode([
        'status' => 'erro',
        'mensagem' => 'Relatório não encontrado'
    ]);
    exit;
  }
  
  // Consultar comentários do relatório
  \$stmt = \$pdo->prepare("
      SELECT 
          c.id, 
          c.comentario, 
          DATE_FORMAT(c.data_criacao, '%d/%m/%Y %H:%i') as data_criacao,
          u.nome as nome_usuario
      FROM comentarios c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.relatorio_id = ?
      ORDER BY c.data_criacao DESC
  ");
  
  \$stmt->execute([\$relatorioId]);
  \$comentarios = \$stmt->fetchAll(PDO::FETCH_ASSOC);
  
  // Retornar os comentários como JSON
  echo json_encode([
      'status' => 'sucesso',
      'comentarios' => \$comentarios
  ]);
  
} catch (Exception \$e) {
  // Em caso de erro, retornar mensagem de erro
  echo json_encode([
      'status' => 'erro',
      'mensagem' => 'Erro ao obter comentários: ' . \$e->getMessage()
  ]);
}
?>
EOT;

if (file_exists($ob_comentarios_file)) {
    $current_content = file_get_contents($ob_comentarios_file);
    
    // Fazer backup do arquivo atual
    $backup_file = $ob_comentarios_file . '.bak.' . time();
    file_put_contents($backup_file, $current_content);
    echo "✓ Backup do arquivo ob_comentários.php criado: $backup_file\n";
    
    // Atualizar o arquivo
    file_put_contents($ob_comentarios_file, $ob_comentarios_content);
    echo "✓ Arquivo ob_comentários.php atualizado.\n";
} else {
    // Criar o arquivo
    file_put_contents($ob_comentarios_file, $ob_comentarios_content);
    echo "✓ Arquivo ob_comentários.php criado.\n";
}

// 6. Verificar e corrigir arquivo JavaScript de comentários
echo "\n=== Verificando e corrigindo arquivo JavaScript de comentários ===\n";
$comentarios_js_file = 'js/comentarios.js';
$comentarios_js_content = <<<EOT
// Função para carregar comentários
function carregarComentarios(relatorioId) {
    const comentariosContainer = document.getElementById('comentarios-container');
    if (!comentariosContainer) return;
    
    comentariosContainer.innerHTML = '<p class="text-center">Carregando comentários...</p>';
    
    fetch(`php/ob_comentários.php?relatorio_id=\${relatorioId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'sucesso') {
                if (data.comentarios.length === 0) {
                    comentariosContainer.innerHTML = '<p class="text-center">Nenhum comentário ainda. Seja o primeiro a comentar!</p>';
                } else {
                    let html = '';
                    data.comentarios.forEach(comentario => {
                        html += `
                            <div class="comentario">
                                <div class="comentario-header">
                                    <strong>\${comentario.nome_usuario}</strong>
                                    <span class="comentario-data">\${comentario.data_criacao}</span>
                                </div>
                                <div class="comentario-texto">\${comentario.comentario}</div>
                            </div>
                        `;
                    });
                    comentariosContainer.innerHTML = html;
                }
            } else {
                comentariosContainer.innerHTML = `<p class="text-center text-danger">Erro ao carregar comentários: \${data.mensagem}</p>`;
                console.error('Erro ao carregar comentários:', data.mensagem);
            }
        })
        .catch(error => {
            comentariosContainer.innerHTML = '<p class="text-center text-danger">Erro ao carregar comentários. Tente novamente mais tarde.</p>';
            console.error('Erro na requisição:', error);
        });
}

// Função para adicionar comentário
function adicionarComentario(event) {
    event.preventDefault();
    
    const form = event.target;
    const relatorioId = form.querySelector('input[name="relatorio_id"]').value;
    const comentario = form.querySelector('textarea[name="comentario"]').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const mensagemElement = document.getElementById('comentario-mensagem');
    
    // Validação básica
    if (!comentario.trim()) {
        mensagemElement.innerHTML = '<div class="alert alert-danger">Por favor, digite um comentário.</div>';
        return;
    }
    
    // Desabilitar botão durante o envio
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    // Limpar mensagens anteriores
    mensagemElement.innerHTML = '';
    
    // Criar FormData
    const formData = new FormData();
    formData.append('relatorio_id', relatorioId);
    formData.append('comentario', comentario);
    
    // Enviar requisição
    fetch('php/add_comentário.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'sucesso') {
            mensagemElement.innerHTML = '<div class="alert alert-success">Comentário adicionado com sucesso!</div>';
            form.reset();
            carregarComentarios(relatorioId);
        } else {
            mensagemElement.innerHTML = `<div class="alert alert-danger">Erro: \${data.mensagem}</div>`;
        }
    })
    .catch(error => {
        mensagemElement.innerHTML = '<div class="alert alert-danger">Erro ao enviar comentário. Tente novamente mais tarde.</div>';
        console.error('Erro na requisição:', error);
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar';
    });
}
EOT;

if (file_exists($comentarios_js_file)) {
    $current_content = file_get_contents($comentarios_js_file);
    
    // Fazer backup do arquivo atual
    $backup_file = $comentarios_js_file . '.bak.' . time();
    file_put_contents($backup_file, $current_content);
    echo "✓ Backup do arquivo comentarios.js criado: $backup_file\n";
    
    // Atualizar o arquivo
    file_put_contents($comentarios_js_file, $comentarios_js_content);
    echo "✓ Arquivo comentarios.js atualizado.\n";
} else {
    // Criar o arquivo
    file_put_contents($comentarios_js_file, $comentarios_js_content);
    echo "✓ Arquivo comentarios.js criado.\n";
}
?>