<?php
// backend/api/get_archived_photos.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

$projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);

if ($projectId <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid or missing project ID."]);
    exit();
}

try {
    // 1. Fetch project profile_id to construct path
    $stmt = $pdo->prepare("SELECT id, profile_id FROM projects WHERE id = :id");
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Project not found."]);
        exit();
    }

    $profileId = (int)$project['profile_id'];

    // 2. Fetch approved photos for this project
    $stmt = $pdo->prepare("
        SELECT id, filename, confidence_score, created_at 
        FROM project_photos 
        WHERE project_id = :project_id AND review_status = 'approved'
        ORDER BY confidence_score DESC
    ");
    $stmt->execute([':project_id' => $projectId]);
    $photos = $stmt->fetchAll();

    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $baseUrl = "{$protocol}://{$host}/photosort/uploads/children/child_{$profileId}/project_{$projectId}/filtered/";

    $formattedPhotos = [];
    foreach ($photos as $photo) {
        $formattedPhotos[] = [
            "id" => (int)$photo['id'],
            "filename" => $photo['filename'],
            "url" => $baseUrl . $photo['filename'],
            "confidence" => (float)$photo['confidence_score'],
            "created_at" => $photo['created_at']
        ];
    }

    echo json_encode([
        "status" => "success",
        "data" => $formattedPhotos
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Query failed: " . $e->getMessage()
    ]);
}
