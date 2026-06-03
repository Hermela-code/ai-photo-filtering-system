<?php
// backend/api/upload_project_files.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

$projectId = isset($_POST['project_id']) ? (int)$_POST['project_id'] : 0;

if ($projectId <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid or missing project ID."]);
    exit();
}

try {
    // 1. Fetch project details to verify existence and get profile_id
    $stmt = $pdo->prepare("SELECT id, profile_id FROM projects WHERE id = :id");
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Project not found."]);
        exit();
    }

    $profileId = (int)$project['profile_id'];

    $pdo->beginTransaction();

    // 2. Setup the folders with forced 0777 permissions
    $childDir = __DIR__ . "/../../uploads/children/child_{$profileId}/";
    $baseUploadDir = $childDir . "project_{$projectId}/";
    $samplesDir = $baseUploadDir . "samples/";
    $sourceDir = $baseUploadDir . "source/";
    $filteredDir = $baseUploadDir . "filtered/";

    $dirs = [$childDir, $baseUploadDir, $samplesDir, $sourceDir, $filteredDir];
    foreach ($dirs as $dir) {
        if (!file_exists($dir)) {
            if (!mkdir($dir, 0777, true)) {
                throw new Exception("Failed to create directory: " . $dir);
            }
        }
        chmod($dir, 0777);
    }

    // 3. Move Target Child Reference Photos (samples) and force 0777 permissions
    $uploadedSamplesCount = 0;
    if (isset($_FILES['samples']) && is_array($_FILES['samples']['name'])) {
        foreach ($_FILES['samples']['tmp_name'] as $key => $tmpName) {
            if ($_FILES['samples']['error'][$key] === UPLOAD_ERR_OK && is_uploaded_file($tmpName)) {
                $fileName = basename($_FILES['samples']['name'][$key]);
                // Sanitize filename to prevent directory traversal
                $fileName = preg_replace("/[^a-zA-Z0-9\._-]/", "_", $fileName);
                $targetFile = $samplesDir . $fileName;
                if (move_uploaded_file($tmpName, $targetFile)) {
                    chmod($targetFile, 0777);
                    $uploadedSamplesCount++;
                }
            }
        }
    }

    // 4. Move Bulk Photos (source) and force 0777 permissions
    $uploadedSourceCount = 0;
    if (isset($_FILES['bulk']) && is_array($_FILES['bulk']['name'])) {
        foreach ($_FILES['bulk']['tmp_name'] as $key => $tmpName) {
            if ($_FILES['bulk']['error'][$key] === UPLOAD_ERR_OK && is_uploaded_file($tmpName)) {
                $fileName = basename($_FILES['bulk']['name'][$key]);
                // Sanitize filename
                $fileName = preg_replace("/[^a-zA-Z0-9\._-]/", "_", $fileName);
                $targetFile = $sourceDir . $fileName;
                if (move_uploaded_file($tmpName, $targetFile)) {
                    chmod($targetFile, 0777);
                    $uploadedSourceCount++;
                }
            }
        }
    }

    // 5. Update project status to 'Processing' and save source photos count
    $stmt = $pdo->prepare("
        UPDATE projects 
        SET status = 'Processing', total_source_photos = :total_photos
        WHERE id = :project_id
    ");
    $stmt->execute([
        ':total_photos' => $uploadedSourceCount,
        ':project_id' => $projectId
    ]);

    $pdo->commit();

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Files uploaded successfully and project queued for processing.",
        "project_id" => $projectId,
        "total_source_photos" => $uploadedSourceCount,
        "samples_uploaded" => $uploadedSamplesCount
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to upload project files: " . $e->getMessage()
    ]);
}
