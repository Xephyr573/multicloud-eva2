<?php
/**
 * PHARMACY ERP SYSTEM - DATABASE CONFIGURATION
 * This file contains database credentials and configuration
 * 
 * IMPORTANT: In production, use environment variables instead of hardcoding credentials
 */

// Database Configuration
define('DB_HOST', 'localhost');           // Database host
define('DB_USER', 'root');                // Database user
define('DB_PASSWORD', '');                // Database password (empty for local development)
define('DB_NAME', 'pharmacy_erp');        // Database name
define('DB_PORT', 3306);                  // MySQL/MariaDB port (default 3306)

// Application Configuration
define('APP_NAME', 'Pharmacy ERP System');
define('APP_VERSION', '1.0.0');

// Error Reporting (set to false in production)
define('DEBUG_MODE', true);

// CORS Configuration
define('ALLOWED_ORIGIN', '*');  // For development only. Use specific domain in production

// API Response Headers
header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
?>
