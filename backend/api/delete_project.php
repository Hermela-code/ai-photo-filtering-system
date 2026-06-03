<?php
// backend/api/delete_project.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

// Support both urlencoded/form-data and JSON input
$projectId = isset($_POST['project_id']) ? (int)$_POST['project_id'] : 0;
if ($projectId <= 0) {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if (isset($data['project_id'])) {
        $projectId = (int)$data['project_id'];
    }
}

if ($projectId <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid or missing project ID."]);
    exit();
}

/**
 * Recursively deletes a directory and all of its contents.
 */
function deleteDirectory($dir) {
    if (!file_exists($dir)) {
        return true;
    }
    if (!is_dir($dir)) {
        return unlink($dir);
    }
    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') {
            continue;
        }
        if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
            return false;
        }
    }
    return rmdir($dir);
}

try {
    // 1. Fetch project profile_id before deletion
    $stmt = $pdo->prepare("SELECT profile_id FROM projects WHERE id = :id");
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Project not found."]);
        exit();
    }

    $profileId = (int)$project['profile_id'];

    // 2. Perform File System Deletion
    $targetDir = __DIR__ . "/../../uploads/children/child_{$profileId}/project_{$projectId}";
    if (file_exists($targetDir)) {
        $realTargetDir = realpath($targetDir);
        $realBaseUploads = realpath(__DIR__ . "/../../uploads");
        
        // Secure validation to prevent directory traversal
        if ($realTargetDir !== false && $realBaseUploads !== false && strpos($realTargetDir, $realBaseUploads) === 0) {
            deleteDirectory($realTargetDir);
        } else {
            throw new Exception("Security validation failed: target directory path is outside the uploads base directory.");
        }
    }

    // 3. Perform Database Deletion in a transaction
    $pdo->beginTransaction();

    // Delete associated photos
    $stmt = $pdo->prepare("DELETE FROM project_photos WHERE project_id = :project_id");
    $stmt->execute([':project_id' => $projectId]);

    // Delete the project
    $stmt = $pdo->prepare("DELETE FROM projects WHERE id = :id");
    $stmt->execute([':id' => $projectId]);

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Project and all associated files deleted successfully.",
        "project_id" => $projectId
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database deletion failed: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "An error occurred during deletion: " . $e->getMessage()
    ]);
}
