<?php
// backend/api/get_project_details.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

$projectId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($projectId <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid or missing project ID."]);
    exit();
}

try {
    // 1. Fetch project details with child profile info
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.profile_id,
            p.project_name,
            p.description,
            p.status,
            p.total_source_photos,
            p.matched_photos,
            p.archive_type,
            p.archive_size,
            p.created_at,
            c.child_name
        FROM projects p
        INNER JOIN children_profiles c ON p.profile_id = c.id
        WHERE p.id = :id
    ");
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Project not found."]);
        exit();
    }

    // 2. Fetch all photos associated with this project
    $stmt = $pdo->prepare("
        SELECT 
            id,
            filename,
            confidence_score,
            review_status,
            created_at
        FROM project_photos
        WHERE project_id = :project_id
        ORDER BY confidence_score DESC
    ");
    $stmt->execute([':project_id' => $projectId]);
    $photos = $stmt->fetchAll();

    // Determine the base URL dynamically
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $baseUrl = "{$protocol}://{$host}/photosort/uploads/children/child_{$project['profile_id']}/project_{$project['id']}/filtered/";

    $formattedPhotos = [];
    foreach ($photos as $photo) {
        $formattedPhotos[] = [
            "id" => (int)$photo['id'],
            "filename" => $photo['filename'],
            "url" => $baseUrl . $photo['filename'], // Full URL to image
            "confidence" => (float)$photo['confidence_score'], // Map confidence_score to React's confidence
            "status" => $photo['review_status'], // Map review_status to React's status ('pending', 'approved', 'rejected')
            "created_at" => $photo['created_at']
        ];
    }

    $formattedProject = [
        "id" => (int)$project['id'],
        "profile_id" => (int)$project['profile_id'],
        "name" => $project['project_name'],
        "child_name" => $project['child_name'],
        "description" => $project['description'],
        "status" => $project['status'],
        "totalPhotos" => (int)$project['total_source_photos'],
        "matchedPhotos" => (int)$project['matched_photos'],
        "archive_type" => $project['archive_type'],
        "archive_size" => $project['archive_size'],
        "date" => date("M j, Y", strtotime($project['created_at'])),
        "photos" => $formattedPhotos
    ];

    echo json_encode([
        "status" => "success",
        "data" => $formattedProject
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database query failed: " . $e->getMessage()
    ]);
}
