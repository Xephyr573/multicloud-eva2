// backend/server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 80; // La rúbrica pide exponer la API en el puerto 80

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la conexión a PostgreSQL
// En Docker, el host será el nombre del servicio de la BD (ej. 'postgres-db')
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'pharmacy_erp',
    password: process.env.DB_PASSWORD || 'admin123',
    port: 5432,
});

// GET: Obtener todos los productos
app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json({ success: true, message: 'Productos obtenidos', data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al obtener productos' });
    }
});

// GET: Obtener un producto por ID (para el modal de edición)
app.get('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            res.json({ success: true, data: result.rows[0] });
        } else {
            res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al obtener el producto' });
    }
});

// POST: Crear un nuevo producto
app.post('/api/productos', async (req, res) => {
    try {
        const { id, product_name, description, quantity, unit_price } = req.body;
        
        // Verificar si existe
        const check = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
        if (check.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'El ID del producto ya existe' });
        }

        const query = `INSERT INTO products (id, product_name, description, quantity, unit_price) 
                        VALUES ($1, $2, $3, $4, $5) RETURNING id`;
        await pool.query(query, [id, product_name, description, quantity, unit_price]);
        res.status(201).json({ success: true, message: 'Producto registrado exitosamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al registrar producto' });
    }
});

// PUT: Actualizar un producto
app.put('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { product_name, description, quantity, unit_price } = req.body;
        
        const query = `UPDATE products 
                        SET product_name = $1, description = $2, quantity = $3, unit_price = $4 
                        WHERE id = $5`;
        const result = await pool.query(query, [product_name, description, quantity, unit_price, id]);
        
        if (result.rowCount > 0) {
            res.json({ success: true, message: 'Producto actualizado exitosamente' });
        } else {
            res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error al actualizar producto' });
    }
});

// DELETE: Eliminar un producto
app.delete('/api/productos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);
        
        if (result.rowCount > 0) {
            res.json({ success: true, message: 'Producto eliminado exitosamente' });
        } else {
            res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    }
});

app.listen(port, () => {
    console.log(`API de Farmacia SIMI corriendo en el puerto ${port}`);
});