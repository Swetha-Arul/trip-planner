<?php
session_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 1. Connect to the Database
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "tripplanner";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
  header("Location: ../signuplogin/login.html?error=" . urlencode("Database connection failed."));
  exit();
}

// 2. Get login form data
$email = $_POST['email'];
$passwordInput = $_POST['password'];

// 3. Retrieve the user from the database using the email
$sql = "SELECT * FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();


if ($result && $result->num_rows > 0) {
  $user = $result->fetch_assoc();

  if (password_verify($passwordInput, $user['password'])) {
      header("Location: ../map/map.html");
      exit();
  } else {
      header("Location: ../signuplogin/login.html?error=" . urlencode("Incorrect password."));
      exit();
  }
} else {
  header("Location: ../signuplogin/login.html?error=" . urlencode("No user found with that email."));
  exit();
}

$stmt->close();
$conn->close();


?>
