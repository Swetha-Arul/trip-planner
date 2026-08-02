<?php
session_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$servername = $_ENV['DB_HOST'];
$username   = $_ENV['DB_USER'];
$password   = $_ENV['DB_PASSWORD'];
$dbname     = $_ENV['DB_NAME'];

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// 2. Retrieve form data
$name = $_POST['name'];
$usernameInput = $_POST['username'];
$email = $_POST['email'];
$passwordInput = $_POST['password'];

// 3. Check if user already exists (by email)
$sql = "SELECT * FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
  header("Location: ../signuplogin/signup.html?error=" . urlencode("A user with this email already exists."));
  exit();
}
$stmt->close();

// 4. Hash the password for security
$hashedPassword = password_hash($passwordInput, PASSWORD_DEFAULT);

// 5. Insert the new user into the database
$sql = "INSERT INTO users (name, username, email, password) VALUES (?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssss", $name, $usernameInput, $email, $hashedPassword);

if ($stmt->execute()) {
  header("Location: ../map/map.html");
  exit();
} else {
  header("Location: ../signuplogin/signup.html?error=" . urlencode("Failed to signup. Please try again."));
  exit();
}

$stmt->close();
$conn->close();
?>
