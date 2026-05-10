<?php
/**
 * PHARMACY ERP SYSTEM - API BACKEND
 * REST API for product management operations
 * Handles POST (create) and GET (retrieve) requests
 * Uses PDO prepared statements for security
 */

require_once 'config.php';
require_once 'db_connect.php';

class ProductAPI {
    private $connection;

    /**
     * Constructor - Initialize database connection
     */
    public function __construct() {
        $this->connection = DatabaseConnection::getConnection();
    }

    /**
     * Handle API requests
     * Routes to appropriate method based on HTTP method
     */
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];

        switch ($method) {
            case 'GET':
                $this->handleGetRequest();
                break;
            case 'POST':
                $this->handlePostRequest();
                break;
            case 'PUT':
                $this->handlePutRequest();
                break;
            case 'DELETE':
                $this->handleDeleteRequest();
                break;
            default:
                $this->sendResponse(false, 'Method not allowed', null, 405);
                break;
        }
    }

    /**
     * Handle GET request - Retrieve all products
     */
    private function handleGetRequest() {
        try {
            $query = "SELECT id, product_name, description, quantity, unit_price, created_at 
                      FROM products 
                      ORDER BY created_at DESC";

            $statement = $this->connection->prepare($query);
            $statement->execute();
            $products = $statement->fetchAll();

            if ($products) {
                $this->sendResponse(
                    true,
                    'Products retrieved successfully',
                    $products,
                    200
                );
            } else {
                $this->sendResponse(
                    true,
                    'No products found',
                    [],
                    200
                );
            }
        } catch (Exception $e) {
            error_log('GET Error: ' . $e->getMessage());
            $this->sendResponse(
                false,
                'Error retrieving products',
                null,
                500
            );
        }
    }

    /**
     * Handle POST request - Create new product
     */
    private function handlePostRequest() {
        try {
            // Get JSON input
            $input = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            if (!$this->validateInput($input)) {
                $this->sendResponse(
                    false,
                    'Invalid input: All fields are required',
                    null,
                    400
                );
                return;
            }

            // Sanitize input data
            $id = intval($input['id']);
            $product_name = trim(strval($input['product_name']));
            $description = trim(strval($input['description']));
            $quantity = intval($input['quantity']);
            $unit_price = floatval($input['unit_price']);

            // Validate data types and ranges
            if ($id <= 0 || $quantity < 0 || $unit_price < 0) {
                $this->sendResponse(
                    false,
                    'Invalid data: IDs and prices must be positive',
                    null,
                    400
                );
                return;
            }

            if (strlen($product_name) > 100) {
                $this->sendResponse(
                    false,
                    'Product name too long (max 100 characters)',
                    null,
                    400
                );
                return;
            }

            // Check if product ID already exists
            $checkQuery = "SELECT id FROM products WHERE id = ?";
            $checkStatement = $this->connection->prepare($checkQuery);
            $checkStatement->execute([$id]);

            if ($checkStatement->rowCount() > 0) {
                $this->sendResponse(
                    false,
                    'Product ID already exists',
                    null,
                    409
                );
                return;
            }

            // Insert product using prepared statement
            $insertQuery = "INSERT INTO products (id, product_name, description, quantity, unit_price) 
                           VALUES (?, ?, ?, ?, ?)";

            $statement = $this->connection->prepare($insertQuery);
            $result = $statement->execute([
                $id,
                $product_name,
                $description,
                $quantity,
                $unit_price
            ]);

            if ($result) {
                $this->sendResponse(
                    true,
                    'Product registered successfully',
                    ['id' => $id],
                    201
                );
            } else {
                $this->sendResponse(
                    false,
                    'Error registering product',
                    null,
                    500
                );
            }
        } catch (PDOException $e) {
            error_log('Database Error: ' . $e->getMessage());
            $this->sendResponse(
                false,
                'Database error: ' . $e->getMessage(),
                null,
                500
            );
        } catch (Exception $e) {
            error_log('General Error: ' . $e->getMessage());
            $this->sendResponse(
                false,
                'An error occurred',
                null,
                500
            );
        }
    }

    /**
     * Validate input data
     * 
     * @param array $input - Input data to validate
     * @return bool - True if valid, false otherwise
     */
    private function validateInput($input) {
        return isset($input['id']) &&
               isset($input['product_name']) &&
               isset($input['description']) &&
               isset($input['quantity']) &&
               isset($input['unit_price']);
    }

    /**
     * Send JSON response
     * 
     * @param bool $success - Success status
     * @param string $message - Response message
     * @param mixed $data - Response data (optional)
     * @param int $status_code - HTTP status code (default 200)
     */
    private function sendResponse($success, $message, $data = null, $status_code = 200) {
        http_response_code($status_code);

        $response = [
            'success' => $success,
            'message' => $message,
            'data' => $data
        ];

        echo json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Handle PUT request - Update product (quantity and price only)
     */
    private function handlePutRequest() {
        try {
            // Get JSON input
            $input = json_decode(file_get_contents('php://input'), true);

            // Validate required fields
            if (!isset($input['id']) || !isset($input['quantity']) || !isset($input['unit_price'])) {
                $this->sendResponse(
                    false,
                    'Invalid input: id, quantity, and unit_price are required',
                    null,
                    400
                );
                return;
            }

            $id = intval($input['id']);
            $quantity = intval($input['quantity']);
            $unit_price = floatval($input['unit_price']);

            // Validate data ranges
            if ($id <= 0 || $quantity < 0 || $unit_price < 0) {
                $this->sendResponse(
                    false,
                    'Invalid data: ID, quantity, and price must be non-negative',
                    null,
                    400
                );
                return;
            }

            // Check if product exists
            $checkQuery = "SELECT id FROM products WHERE id = ?";
            $checkStatement = $this->connection->prepare($checkQuery);
            $checkStatement->execute([$id]);

            if ($checkStatement->rowCount() === 0) {
                $this->sendResponse(
                    false,
                    'Product not found',
                    null,
                    404
                );
                return;
            }

            // Update product using prepared statement
            $updateQuery = "UPDATE products SET quantity = ?, unit_price = ?, updated_at = NOW() WHERE id = ?";
            $statement = $this->connection->prepare($updateQuery);
            $result = $statement->execute([
                $quantity,
                $unit_price,
                $id
            ]);

            if ($result) {
                $this->sendResponse(
                    true,
                    'Product updated successfully',
                    ['id' => $id],
                    200
                );
            } else {
                $this->sendResponse(
                    false,
                    'Error updating product',
                    null,
                    500
                );
            }
        } catch (PDOException $e) {
            error_log('Database Error: ' . $e->getMessage());
            $this->sendResponse(
                false,
                'Database error: ' . $e->getMessage(),
                null,
                500
            );
        } catch (Exception $e) {
            error_log('General Error: ' . $e->getMessage());
            $this->sendResponse(
                false,
                'An error occurred',
                null,
                500
            );
        }
    }

    /**
     * Handle DELETE request - Delete product
     */
    private function handleDeleteRequest() {
        try {
            // Get product ID from query string
            if (!isset($_GET['id'])) {
                $this->sendResponse(
                    false,
                    'Invalid input: product id is required',
                    null,
                    400
                );
                return;
            }

            $id = intval($_GET['id']);

            if ($id <= 0) {
                $this->sendResponse(
                    false,
                    'Invalid data: ID must be positive',
                    null,
                    400
                );
                return;
            }

            // Check if product exists
            $checkQuery = "SELECT id FROM products WHERE id = ?";
            $checkStatement = $this->connection->prepare($checkQuery);
            $checkStatement->execute([$id]);

            if ($checkStatement->rowCount() === 0) {
                $this->sendResponse(
                    false,
                    'Product not found',
                    null,
                    404
                );
                return;
            }

            // Delete product using prepared statement
            $deleteQuery = "DELETE FROM products WHERE id = ?";
            $statement = $this->connection->prepare($deleteQuery);
            $result = $statement->execute([$id]);

            if ($result) {
                $this->sendResponse(
                    true,
                    'Product deleted successfully',
                    ['id' => $id],
                    200
                );
            } else {
                $this->sendResponse(
                    false,
                    'Error deleting product',
                    null,
                    500
                );
            }
        } catch (PDOException $e) {
            error_log('Database Error: ' . $e->getMessage());
            $this->sendResponse(
                false,
                'Database error: ' . $e->getMessage(),
                null,
                500
            );
        } catch (Exception $e) {
            error_log('General Error: ' . $e->getMessage());
            $this->sendResponse(
                false,
                'An error occurred',
                null,
                500
            );
        }
    }
}

// Initialize and handle API request
$api = new ProductAPI();
$api->handleRequest();
?>
