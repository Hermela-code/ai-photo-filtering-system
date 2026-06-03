<?php
// backend/api/get_projects.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

try {
    // Select all projects joined with the child profiles
    $stmt = $pdo->query("
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
        ORDER BY p.created_at DESC
    ");
    $projects = $stmt->fetchAll();

    $formattedProjects = [];
    foreach ($projects as $row) {
        $status = $row['status'];
        
        // Map Tailwind style classes depending on status
        $statusStyle = "bg-gray-50 text-gray-600 border-gray-100";
        switch ($status) {
            case 'Uploading':
                $statusStyle = "bg-blue-50 text-blue-600 border-blue-100";
                break;
            case 'Processing':
                $statusStyle = "bg-purple-50 text-purple-600 border-purple-100";
                break;
            case 'In Review':
                $statusStyle = "bg-orange-50 text-orange-600 border-orange-100";
                break;
            case 'Completed':
                $statusStyle = "bg-emerald-50 text-emerald-600 border-emerald-100";
                break;
            case 'Archived':
                $statusStyle = "bg-gray-50 text-gray-600 border-gray-100";
                break;
            case 'Failed':
                $statusStyle = "bg-red-50 text-red-600 border-red-100";
                break;
        }

        $totalPhotos = (int)$row['total_source_photos'];
        $matchedPhotos = (int)$row['matched_photos'];
        
        // Calculate progress
        $hasProgress = in_array($status, ['Processing', 'In Review', 'Completed']) && $totalPhotos > 0;
        $progressPercent = $totalPhotos > 0 ? (int)round(($matchedPhotos / $totalPhotos) * 100) : 0;
        if ($progressPercent > 100) $progressPercent = 100;

        // Format date, e.g., "Jun 2, 2026"
        $formattedDate = date("M j, Y", strtotime($row['created_at']));

        $formattedProjects[] = [
            "id" => (int)$row['id'],
            "profile_id" => (int)$row['profile_id'],
            "name" => $row['project_name'], // map project_name to React's project.name
            "child_name" => $row['child_name'],
            "description" => $row['description'],
            "status" => $status,
            "totalPhotos" => $totalPhotos,
            "matchedPhotos" => $matchedPhotos,
            "date" => $formattedDate,
            "hasProgress" => $hasProgress,
            "progressPercent" => $progressPercent,
            "statusStyle" => $statusStyle,
            "archive_type" => $row['archive_type'],
            "archive_size" => $row['archive_size']
        ];
    }

    echo json_encode([
        "status" => "success",
        "data" => $formattedProjects
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database query failed: " . $e->getMessage()
    ]);
}
