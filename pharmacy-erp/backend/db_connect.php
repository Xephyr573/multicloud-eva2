<?php
/**
 * PHARMACY ERP SYSTEM - DATABASE CONNECTION
 * Establishes PDO connection to MariaDB/MySQL database
 * Uses prepared statements for security
 */

require_once 'config.php';

class DatabaseConnection {
    private static $connection = null;

    /**
     * Get database connection instance (Singleton pattern)
     * 
     * @return PDO|null - Database connection object or null on error
     */
    public static function getConnection() {
        if (self::$connection === null) {
            try {
                // Construct DSN (Data Source Name)
                $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME;

                // Create PDO connection
                self::$connection = new PDO(
                    $dsn,
                    DB_USER,
                    DB_PASSWORD,
                    array(
                        // Set error mode to exceptions
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        // Set default fetch mode to associative array
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        // Enable emulated prepared statements (safer for MariaDB)
                        PDO::ATTR_EMULATE_PREPARES => false
                    )
                );

                // Set character set to UTF-8
                self::$connection->exec("SET CHARACTER SET utf8mb4");

                return self::$connection;
            } catch (PDOException $e) {
                // Log error securely (don't expose database details)
                error_log('Database Connection Error: ' . $e->getMessage());

                if (DEBUG_MODE) {
                    die(json_encode([
                        'success' => false,
                        'message' => 'Database connection failed: ' . $e->getMessage()
                    ]));
                } else {
                    die(json_encode([
                        'success' => false,
                        'message' => 'Database connection failed. Please try again later.'
                    ]));
                }
            }
        }

        return self::$connection;
    }

    /**
     * Close database connection
     */
    public static function closeConnection() {
        self::$connection = null;
    }
}

// Establish connection on require
DatabaseConnection::getConnection();
?>
