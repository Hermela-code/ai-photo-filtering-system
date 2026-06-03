<?php
// backend/api/download_event_archive.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

$projectId = isset($_GET['project_id']) ? (int)$_GET['project_id'] : 0;

if ($projectId <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid or missing project ID."]);
    exit();
}

try {
    // 1. Fetch project profile_id and project name
    $stmt = $pdo->prepare("SELECT id, profile_id, project_name FROM projects WHERE id = :id");
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch();

    if (!$project) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Project not found."]);
        exit();
    }

    $profileId = (int)$project['profile_id'];
    $projectName = trim($project['project_name']);
    $safeProjectName = preg_replace("/[^a-zA-Z0-9\._-]/", "_", $projectName);
    if (empty($safeProjectName)) {
        $safeProjectName = "project_" . $projectId;
    }

    // 2. Fetch all approved photos for this project
    $stmt = $pdo->prepare("
        SELECT filename 
        FROM project_photos 
        WHERE project_id = :project_id AND review_status = 'approved'
    ");
    $stmt->execute([':project_id' => $projectId]);
    $photos = $stmt->fetchAll();

    if (empty($photos)) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "No approved photos found for this project."]);
        exit();
    }

    // 3. Check for ZipArchive support
    if (!class_exists('ZipArchive')) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "ZipArchive extension is not enabled in PHP configuration."]);
        exit();
    }

    // 4. Create a temporary zip file
    $tempZipFile = tempnam(sys_get_temp_dir(), 'zip_');
    if ($tempZipFile === false) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to create temporary file."]);
        exit();
    }

    $zip = new ZipArchive();
    if ($zip->open($tempZipFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Could not create zip archive."]);
        exit();
    }

    $addedFilesCount = 0;
    foreach ($photos as $photo) {
        $filename = $photo['filename'];
        $filteredPath = __DIR__ . "/../../uploads/children/child_{$profileId}/project_{$projectId}/filtered/" . $filename;
        $sourcePath = __DIR__ . "/../../uploads/children/child_{$profileId}/project_{$projectId}/source/" . $filename;

        // Try filtered directory first, then fallback to source directory
        if (file_exists($filteredPath)) {
            $zip->addFile($filteredPath, $filename);
            $addedFilesCount++;
        } elseif (file_exists($sourcePath)) {
            $zip->addFile($sourcePath, $filename);
            $addedFilesCount++;
        }
    }

    $zip->close();

    // If no files were actually found and added to the zip, clean up and error out
    if ($addedFilesCount === 0) {
        @unlink($tempZipFile);
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "None of the approved photos could be located on the server filesystem."]);
        exit();
    }

    // 5. Clean output buffer before sending zip file
    if (ob_get_level()) {
        ob_end_clean();
    }

    // 6. Send headers and stream file
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $safeProjectName . '_approved_photos.zip"');
    header('Content-Length: ' . filesize($tempZipFile));
    header('Pragma: no-cache');
    header('Expires: 0');

    readfile($tempZipFile);
    @unlink($tempZipFile);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database query failed: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "An unexpected error occurred: " . $e->getMessage()]);
}
