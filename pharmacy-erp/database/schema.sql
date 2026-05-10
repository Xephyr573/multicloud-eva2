CREATE DATABASE IF NOT EXISTS pharmacy_erp;

USE pharmacy_erp;

CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY COMMENT 'Unique product identifier',
    product_name VARCHAR(100) NOT NULL COMMENT 'Name of the pharmaceutical product',
    description TEXT NOT NULL COMMENT 'Detailed description of the product',
    quantity INT NOT NULL DEFAULT 0 COMMENT 'Current stock quantity',
    unit_price DECIMAL(10, 2) NOT NULL COMMENT 'Price per unit in USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores pharmaceutical product information';

CREATE INDEX idx_product_name ON products(product_name);

CREATE INDEX idx_created_at ON products(created_at);

SHOW TABLES;
DESCRIBE products;
