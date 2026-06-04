<?php
// Check if we are running on the live VPS or custom domain
if ($_SERVER['SERVER_NAME'] == '173.212.213.249') {
    // Live Server Credentials
    define('DB_HOST', 'localhost');
    define('DB_USER', 'photosort_admin');
    define('DB_PASS', 'qazxswedc1234!@#$'); // Or whatever password you set
    define('DB_NAME', 'photosort');
    define('BASE_URL', 'http://173.212.213.249/ai-photo-filtering-system');
} else {
    // Local XAMPP Credentials
    define('DB_HOST', 'localhost');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_NAME', 'photosort');
    define('BASE_URL', 'http://localhost/ai-photo-filtering-system');
}
?>