<?php
require_once './conexao.php';

// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Verificar se é uma requisição POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obter dados do formulário
    $nome = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['password'] ?? '';
    
    // Validação básica
    $erros = [];
    
    if (empty($nome)) {
        $erros[] = "Nome é obrigatório";
    }
    
    if (empty($email)) {
        $erros[] = "Email é obrigatório";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $erros[] = "Email inválido";
    }
    
    if (empty($senha)) {
        $erros[] = "Senha é obrigatória";
    } elseif (strlen($senha) < 8) {
        $erros[] = "Senha deve ter pelo menos 8 caracteres";
    }
    
    // Verificar se o email já existe
    if (empty($erros)) {
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() > 0) {
            $erros[] = "Este email já está cadastrado";
        }
    }
    
    // Se não houver erros, cadastrar o usuário
    if (empty($erros)) {
        // Hash da senha
        $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
        
        // Inserir no banco de dados
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)");
        
        try {
            $stmt->execute([$nome, $email, $senhaHash]);
            
            // Obter o ID do usuário inserido
            $usuarioId = $pdo->lastInsertId();
            
            // Iniciar sessão
            $_SESSION['usuario_id'] = $usuarioId;
            $_SESSION['usuario_nome'] = $nome;
            $_SESSION['usuario_email'] = $email;
            
            // Resposta de sucesso
            echo json_encode([
                'status' => 'sucesso',
                'mensagem' => 'Cadastro realizado com sucesso!',
                'classe' => 'mensagem-sucesso'
            ]);
            exit;
            
        } catch (PDOException $e) {
            $erros[] = "Erro ao cadastrar: " . $e->getMessage();
        }
    }
    
    // Se chegou aqui, houve erros
    echo json_encode([
        'status' => 'erro',
        'mensagem' => implode(', ', $erros),
        'classe' => 'mensagem-erro'
    ]);
    exit;
}
?>

