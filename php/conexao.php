<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Configurações do banco de dados
$host = 'localhost'; // Endereço do servidor do banco de dados
$usuario = 'py';   // Usuário do banco de dados
$senha = '1234';         // Senha do banco de dados
$banco = 'voz_do_bairro'; // Nome do banco de dados
$port = 3307;       // Porta do banco de dados (padrão é 3306 para MySQL)

// Criar conexão
$conn = new mysqli($host, $usuario, $senha, $banco, $port);

// Verificar conexão
if ($conn->connect_error) {
    die("Erro de conexão: " . $conn->connect_error);
}

// Função para verificar se o usuário está logado
function estaLogado() {
    return isset($_SESSION['usuario_id']);
}
?>

