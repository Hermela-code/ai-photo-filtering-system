<?php
// backend/create_project.php
require_once 'config.php';
require_once 'db_connect.php';

// Only accept POST requests for resource creation
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

// Read and decode the raw HTTP input stream from React
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$projectName = isset($data['name']) ? trim($data['name']) : '';
$description = isset($data['description']) ? trim($data['description']) : '';

// Simple validation boundary
if (empty($projectName)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Project name is required."]);
    exit();
}

try {
    $sql = "INSERT INTO projects (name, description, status) VALUES (:name, :description, 'Processing')";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':name' => $projectName,
        ':description' => $description
    ]);
    
    $projectId = $pdo->lastInsertId();
    
    http_response_code(201);
    echo json_encode([
        "status" => "success",
        "message" => "Project created successfully",
        "project" => [
            "id" => $projectId,
            "name" => $projectName,
            "description" => $description,
            "status" => "Processing"
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to save project: " . $e->getMessage()]);
}