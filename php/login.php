<?php
require_once 'conexao.php';

// Garantir que $conn seja inicializado corretamente
if (!isset($conn) || !$conn) {
    die("<p>Erro: Conexão com o banco de dados não foi estabelecida.</p>");
}

// Iniciar sessão se ainda não estiver iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Verificar se é uma requisição POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obter dados do formulário
    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['password'] ?? '';
    
    // Validação básica
    $erros = [];
    
    if (empty($email)) {
        $erros[] = "Email é obrigatório";
    }
    
    if (empty($senha)) {
        $erros[] = "Senha é obrigatória";
    }

    if (empty($erros)) {
        // Verificar se $conn está configurado corretamente
        if (!$conn) {
            $erros[] = "Erro de conexão com o banco de dados";
        } else {
            // Consultar o banco de dados para verificar as credenciais
            $stmt = $conn->prepare("SELECT id, senha FROM usuarios WHERE email = ?");
            if ($stmt) {
                $stmt->bind_param("s", $email);
                $stmt->execute();
                $result = $stmt->get_result();

                if ($result->num_rows > 0) {
                    $usuario = $result->fetch_assoc();

                    // Verificar a senha
                    if (password_verify($senha, $usuario['senha'])) {
                        // Login bem-sucedido
                        $_SESSION['usuario_id'] = $usuario['id'];
                        header('Location: ../index.html');
                        exit;
                    } else {
                        $erros[] = "Senha incorreta";
                    }
                } else {
                    $erros[] = "Usuário não encontrado";
                }
            } else {
                $erros[] = "Erro ao preparar a consulta: " . $conn->error;
            }
        }
    }

    // Exibir erros, se houver
    if (!empty($erros)) {
        foreach ($erros as $erro) {
            echo "<p>$erro</p>";
        }
    }
} else {
    header('Location: ../index.html');
    exit;
}
?>