<?php
// backend/api/get_dashboard_stats.php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

try {
    // 1. Get images_processed (COUNT(*)) and avg_confidence (AVG(confidence_score))
    $stmt = $pdo->query("SELECT COUNT(*) as images_processed, AVG(confidence_score) as avg_confidence FROM project_photos");
    $photoStats = $stmt->fetch();
    
    $imagesProcessed = (int)($photoStats['images_processed'] ?? 0);
    $avgConfidence = $photoStats['avg_confidence'] !== null ? round((float)$photoStats['avg_confidence'], 1) : 0.0;

    // 2. Get pending_reviews (COUNT(*) of projects with status = 'In Review')
    $stmt = $pdo->query("SELECT COUNT(*) as pending_reviews FROM projects WHERE status = 'In Review'");
    $projectStats = $stmt->fetch();
    $pendingReviews = (int)($projectStats['pending_reviews'] ?? 0);

    // 3. Fetch 4 most recently updated/created projects
    $stmt = $pdo->query("
        SELECT 
            p.id, 
            p.project_name, 
            p.status, 
            p.updated_at,
            c.child_name
        FROM projects p
        INNER JOIN children_profiles c ON p.profile_id = c.id
        ORDER BY p.updated_at DESC 
        LIMIT 4
    ");
    $recentProjects = $stmt->fetchAll();

    // Helper function for relative time
    function get_relative_time($datetime) {
        if (empty($datetime)) return "Unknown";
        $time = strtotime($datetime);
        $diff = time() - $time;
        if ($diff < 60) {
            return "Just now";
        }
        $mins = round($diff / 60);
        if ($mins < 60) {
            return $mins . " " . ($mins == 1 ? "min" : "mins") . " ago";
        }
        $hours = round($diff / 3600);
        if ($hours < 24) {
            return $hours . " " . ($hours == 1 ? "hour" : "hours") . " ago";
        }
        $days = round($diff / 86400);
        if ($days < 7) {
            return $days . " " . ($days == 1 ? "day" : "days") . " ago";
        }
        return date("M j, Y", $time);
    }

    $recentActivity = [];
    foreach ($recentProjects as $project) {
        $status = $project['status'];
        
        // Define user, action, icon, and colors depending on status
        $user = "AI Engine";
        $action = "updated status of";
        $icon = "M13 10V3L4 14h7v7l9-11h-7z";
        $color = "text-purple-500 bg-purple-50";

        switch ($status) {
            case 'Uploading':
                $user = "User";
                $action = "created new project";
                $icon = "M12 4.5v15m7.5-7.5h-15";
                $color = "text-blue-500 bg-blue-50";
                break;
            case 'Processing':
                $user = "AI Engine";
                $action = "is scanning photos for";
                $icon = "M13 10V3L4 14h7v7l9-11h-7z";
                $color = "text-purple-500 bg-purple-50";
                break;
            case 'In Review':
                $user = "AI Engine";
                $action = "flagged photos for review in";
                $icon = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
                $color = "text-amber-500 bg-amber-50";
                break;
            case 'Completed':
                $user = "AI Engine";
                $action = "completed processing";
                $icon = "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4";
                $color = "text-emerald-500 bg-emerald-50";
                break;
            case 'Archived':
                $user = "Hermela Girma";
                $action = "approved and archived";
                $icon = "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12";
                $color = "text-emerald-500 bg-emerald-50";
                break;
            case 'Failed':
                $user = "AI Engine";
                $action = "failed processing";
                $icon = "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z";
                $color = "text-red-500 bg-red-50";
                break;
        }

        $recentActivity[] = [
            "id" => (int)$project['id'],
            "time" => get_relative_time($project['updated_at']),
            "user" => $user,
            "action" => $action,
            "target" => $project['project_name'],
            "icon" => $icon,
            "color" => $color
        ];
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "images_processed" => $imagesProcessed,
            "avg_confidence" => $avgConfidence,
            "pending_reviews" => $pendingReviews,
            "recent_activity" => $recentActivity
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database query failed: " . $e->getMessage()
    ]);
}
