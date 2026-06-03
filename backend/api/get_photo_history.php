<?php
// backend/api/get_photo_history.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

try {
    // Select projects with status 'Completed' or 'Archived', joined with children profiles
    $stmt = $pdo->query("
        SELECT 
            p.id AS project_id,
            p.profile_id,
            p.project_name,
            p.status,
            p.matched_photos,
            p.archive_type,
            p.archive_size,
            p.created_at,
            c.child_name
        FROM projects p
        INNER JOIN children_profiles c ON p.profile_id = c.id
        WHERE p.status IN ('Completed', 'Archived')
        ORDER BY c.child_name ASC, p.created_at DESC
    ");
    $rows = $stmt->fetchAll();

    $data = [];
    foreach ($rows as $row) {
        $profileId = (int)$row['profile_id'];
        
        // If this child profile hasn't been added yet, initialize its structure
        if (!isset($data[$profileId])) {
            $data[$profileId] = [
                "id" => $profileId,
                "name" => $row['child_name'],
                "totalPhotos" => 0,
                "lastActive" => null,
                "history" => []
            ];
        }
        
        // Accumulate total photos count (matched_photos) for this child's projects
        $data[$profileId]['totalPhotos'] += (int)$row['matched_photos'];
        
        $formattedDate = date("M j, Y", strtotime($row['created_at']));
        
        // Set lastActive to the most recent project's date
        // Since we order by p.created_at DESC, the first processed row for a child is the latest
        if ($data[$profileId]['lastActive'] === null) {
            $data[$profileId]['lastActive'] = $formattedDate;
        }
        
        // Add to child's history timeline
        $data[$profileId]['history'][] = [
            "id" => (int)$row['project_id'],
            "date" => $formattedDate,
            "type" => $row['archive_type'], // 'folder' or 'zip'
            "photoCount" => (int)$row['matched_photos'],
            "event" => $row['project_name'],
            "size" => $row['archive_size'] ?? '0 MB'
        ];
    }

    // Convert key-value (profile_id => child) map to index list array
    $formattedData = array_values($data);

    echo json_encode([
        "status" => "success",
        "data" => $formattedData
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database query failed: " . $e->getMessage()
    ]);
}
