<?php
// backend/api/update_photo_status.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

// Parse JSON input
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

$photoId = isset($data['photo_id']) ? (int)$data['photo_id'] : 0;
$newStatus = isset($data['status']) ? trim($data['status']) : '';

if ($photoId <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid or missing photo ID."]);
    exit();
}

$validStatuses = ['pending', 'approved', 'rejected'];
if (!in_array($newStatus, $validStatuses)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid status value. Must be 'pending', 'approved', or 'rejected'."]);
    exit();
}

try {
    $pdo->beginTransaction();

    // 1. Get the project_id associated with this photo
    $stmt = $pdo->prepare("SELECT project_id FROM project_photos WHERE id = :photo_id FOR UPDATE");
    $stmt->execute([':photo_id' => $photoId]);
    $photo = $stmt->fetch();

    if (!$photo) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Photo not found."]);
        exit();
    }

    $projectId = (int)$photo['project_id'];

    // 2. Update the review_status of the photo
    $stmt = $pdo->prepare("UPDATE project_photos SET review_status = :status WHERE id = :photo_id");
    $stmt->execute([
        ':status' => $newStatus,
        ':photo_id' => $photoId
    ]);

    // 3. Count pending photos remaining in this project
    $stmt = $pdo->prepare("SELECT COUNT(*) as pending_count FROM project_photos WHERE project_id = :project_id AND review_status = 'pending'");
    $stmt->execute([':project_id' => $projectId]);
    $pending = $stmt->fetch();
    $pendingCount = (int)$pending['pending_count'];

    // 4. Update parent project status
    // If no pending photos remain, set to 'Completed'. Else, set to 'In Review' to reflect ongoing audit.
    $projectStatus = 'In Review';
    if ($pendingCount === 0) {
        $projectStatus = 'Completed';
    }

    $stmt = $pdo->prepare("UPDATE projects SET status = :status WHERE id = :project_id");
    $stmt->execute([
        ':status' => $projectStatus,
        ':project_id' => $projectId
    ]);

    $pdo->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Photo status updated successfully.",
        "data" => [
            "photo_id" => $photoId,
            "new_status" => $newStatus,
            "project_id" => $projectId,
            "project_status" => $projectStatus,
            "remaining_pending" => $pendingCount
        ]
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Transaction failed: " . $e->getMessage()
    ]);
}
