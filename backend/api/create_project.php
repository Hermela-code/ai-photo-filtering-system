<?php
// backend/api/create_project.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

// Support both JSON input (if sent raw) or multipart/form-data POST parameters
$projectName = isset($_POST['name']) ? trim($_POST['name']) : (isset($_POST['project_name']) ? trim($_POST['project_name']) : '');
$childName = isset($_POST['target_child_name']) ? trim($_POST['target_child_name']) : (isset($_POST['child_name']) ? trim($_POST['child_name']) : '');
$description = isset($_POST['description']) ? trim($_POST['description']) : '';

// Also check JSON body just in case content-type is application/json
if (empty($projectName) || empty($childName)) {
    $rawBody = file_get_contents('php://input');
    if (!empty($rawBody)) {
        $json = json_decode($rawBody, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            if (empty($projectName) && isset($json['name'])) {
                $projectName = trim($json['name']);
            }
            if (empty($projectName) && isset($json['project_name'])) {
                $projectName = trim($json['project_name']);
            }
            if (empty($childName) && isset($json['target_child_name'])) {
                $childName = trim($json['target_child_name']);
            }
            if (empty($childName) && isset($json['child_name'])) {
                $childName = trim($json['child_name']);
            }
            if (empty($description) && isset($json['description'])) {
                $description = trim($json['description']);
            }
        }
    }
}

if (empty($projectName)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Project name is required."]);
    exit();
}

if (empty($childName)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Target child name is required."]);
    exit();
}

try {
    $pdo->beginTransaction();

    // 1. Ensure the child profile exists (INSERT IGNORE)
    $stmt = $pdo->prepare("INSERT IGNORE INTO children_profiles (child_name) VALUES (:child_name)");
    $stmt->execute([':child_name' => $childName]);

    // Retrieve child profile ID
    $stmt = $pdo->prepare("SELECT id FROM children_profiles WHERE child_name = :child_name");
    $stmt->execute([':child_name' => $childName]);
    $profile = $stmt->fetch();
    $profileId = $profile['id'];

    // 2. Insert the project row with 'Uploading' status
    $stmt = $pdo->prepare("
        INSERT INTO projects (profile_id, project_name, description, status, total_source_photos, matched_photos, archive_type, archive_size)
        VALUES (:profile_id, :project_name, :description, 'Uploading', 0, 0, 'folder', '0 MB')
    ");
    $stmt->execute([
        ':profile_id' => $profileId,
        ':project_name' => $projectName,
        ':description' => $description
    ]);
    $projectId = $pdo->lastInsertId();

    $pdo->commit();

    // 3. Format the project details to match what the frontend expects
    $formattedDate = date("M j, Y"); // current date
    $statusStyle = "bg-blue-50 text-blue-600 border-blue-100";
    
    $projectData = [
        "id" => (int)$projectId,
        "profile_id" => (int)$profileId,
        "name" => $projectName,
        "child_name" => $childName,
        "description" => $description,
        "status" => "Uploading",
        "totalPhotos" => 0,
        "matchedPhotos" => 0,
        "date" => $formattedDate,
        "hasProgress" => false,
        "progressPercent" => 0,
        "statusStyle" => $statusStyle,
        "archive_type" => "folder",
        "archive_size" => "0 MB"
    ];

    http_response_code(201);
    echo json_encode([
        "status" => "success",
        "message" => "Project created successfully.",
        "project_id" => (int)$projectId,
        "project" => $projectData
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to create project: " . $e->getMessage()
    ]);
}

