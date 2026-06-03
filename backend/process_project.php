<?php
// backend/process_project.php
require_once 'config.php';
require_once 'db_connect.php';

// Accept only POST form-data 
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

$projectName = isset($_POST['name']) ? trim($_POST['name']) : '';
$description = isset($_POST['description']) ? trim($_POST['description']) : '';

if (empty($projectName)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Project name is required."]);
    exit();
}

try {
    // 1. Initialize the Job Row for Python
    $stmt = $pdo->prepare("INSERT INTO children (name, description, status, totalPhotos, matchedPhotos) VALUES (:name, :desc, 'Uploading', 0, 0)");
    $stmt->execute([
        ':name' => $projectName,
        ':desc' => $description
    ]);
    
    $jobId = $pdo->lastInsertId();

    // 2. Build the exact folder matrix Python expects
    $baseDir = "../uploads/children/child_" . $jobId . "/";
    $samplesDir = $baseDir . "samples/";
    $sourceDir = $baseDir . "source/";
    $filteredDir = $baseDir . "filtered/";

    // Generate folders
    foreach ([$samplesDir, $sourceDir, $filteredDir] as $dir) {
        if (!file_exists($dir)) {
            mkdir($dir, 0775, true);
        }
    }

    // 3. Process Context/Reference Uploads (Target Child Photos)
    if (!empty($_FILES['samples']['name'][0])) {
        foreach ($_FILES['samples']['tmp_name'] as $key => $tmpName) {
            $fileName = basename($_FILES['samples']['name'][$key]);
            move_uploaded_file($tmpName, $samplesDir . $fileName);
        }
    }

    // 4. Process the Core Pipeline Images
    $totalSourcePhotos = 0;
    if (!empty($_FILES['bulk']['name'][0])) {
        foreach ($_FILES['bulk']['tmp_name'] as $key => $tmpName) {
            $fileName = basename($_FILES['bulk']['name'][$key]);
            if (move_uploaded_file($tmpName, $sourceDir . $fileName)) {
                $totalSourcePhotos++;
            }
        }
    }

    // 5. Update status to 'Processing' so engine.py picks it up!
    $updateStmt = $pdo->prepare("UPDATE children SET status = 'Processing', totalPhotos = :total WHERE id = :id");
    $updateStmt->execute([':total' => $totalSourcePhotos, ':id' => $jobId]);

    http_response_code(201);
    echo json_encode([
        "status" => "success",
        "job_id" => $jobId,
        "message" => "Files transferred successfully. Engine queued."
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Transaction Failed: " . $e->getMessage()]);
}