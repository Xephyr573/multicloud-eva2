// Configuración
const API_BASE_URL = 'http://localhost/api/productos';

// DOM Elements
const productForm = document.getElementById('productForm');
const formMessage = document.getElementById('formMessage');
const fetchProductsBtn = document.getElementById('fetchProductsBtn');
const productsTableBody = document.getElementById('productsTableBody');
const tableMessage = document.getElementById('tableMessage');

// Modal Elements
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editMessage = document.getElementById('editMessage');
const closeEditModal = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Estado para saber qué producto se está editando
let editingProductId = null;

/**
 * Initialize event listeners
 */
document.addEventListener('DOMContentLoaded', function() {
    // Form and table handlers
    productForm.addEventListener('submit', handleFormSubmit);
    fetchProductsBtn.addEventListener('click', fetchAllProducts);
    editForm.addEventListener('submit', handleEditSubmit);
    closeEditModal.addEventListener('click', closeModal);
    cancelEditBtn.addEventListener('click', closeModal);
    
    // Cerrar modal si se hace click fuera de él
    window.addEventListener('click', function(event) {
        if (event.target == editModal) {
            closeModal();
        }
    });

    // Navbar functionality
    initializeNavbar();
    
    // Load products on page load
    fetchAllProducts();
});

/**
 * Initialize navbar navigation
 */
function initializeNavbar() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get target section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                // Smooth scroll to section
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/**
 * Handle product form submission (CREATE)
 * Sends POST request to backend API
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(productForm);
    const productData = {
        id: formData.get('id'),
        product_name: formData.get('product_name'),
        description: formData.get('description'),
        quantity: formData.get('quantity'),
        unit_price: formData.get('unit_price')
    };

    if (!validateProductData(productData)) {
        showFormMessage('Por favor, rellene todos los campos correctamente.', 'error');
        return;
    }

    try {
        showFormMessage('Registrando producto...', 'info');

        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (data.success) {
            showFormMessage('✅ ' + (data.message || 'Producto registrado exitosamente'), 'success');
            productForm.reset();
            setTimeout(() => {
                fetchAllProducts();
            }, 1000);
        } else {
            showFormMessage('❌ ' + (data.message || 'Error al registrar el producto.'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showFormMessage('⚠️ Error de conexión con el servidor.', 'error');
    }
}

/**
 * Obtener todos los productos del servidor (READ)
 */
async function fetchAllProducts() {
    try {
        tableMessage.innerHTML = '';

        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            displayProducts(data.data);
        } else {
            showTableMessage('❌ ' + (data.message || 'Error al cargar los productos.'), 'error');
            productsTableBody.innerHTML = '<tr class="empty-row"><td colspan="7">No hay productos disponibles.</td></tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        showTableMessage('⚠️ Error de conexión con el servidor.', 'error');
        productsTableBody.innerHTML = '<tr class="empty-row"><td colspan="7">Error al cargar productos.</td></tr>';
    }
}

/**
 * Mostrar productos en la tabla con botones de acción
 */
function displayProducts(products) {
    productsTableBody.innerHTML = '';

    if (products.length === 0) {
        productsTableBody.innerHTML = '<tr class="empty-row"><td colspan="7">No hay productos registrados aún.</td></tr>';
        updateStats([]);
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');
        const subtotal = (product.quantity * product.unit_price).toFixed(2);
        
        row.innerHTML = `
            <td>${escapeHtml(product.id)}</td>
            <td>${escapeHtml(product.product_name)}</td>
            <td>${escapeHtml(product.description)}</td>
            <td>${escapeHtml(product.quantity)}</td>
            <td>$${parseFloat(product.unit_price).toFixed(2)}</td>
            <td>$${subtotal}</td>
            <td>${formatDateTime(product.created_at)}</td>
        `;
        productsTableBody.appendChild(row);
    });

    showTableMessage(`✅ ${products.length} producto(s) cargado(s).`, 'info');
    updateStats(products);
}

/**
 * Abrir modal para editar un producto
 */
async function openEditModal(productId) {
    try {
        // Obtener datos del producto
        const response = await fetch(`${API_BASE_URL}/${productId}`, {
            method: 'GET'
        });

        const data = await response.json();

        if (data.success && data.data) {
            const product = data.data;
            
            // Rellenar formulario de edición
            document.getElementById('editProductId').value = product.id;
            document.getElementById('editProductName').value = product.product_name;
            document.getElementById('editDescription').value = product.description;
            document.getElementById('editQuantity').value = product.quantity;
            document.getElementById('editUnitPrice').value = product.unit_price;
            
            editingProductId = product.id;
            editMessage.innerHTML = '';
            
            // Mostrar modal
            editModal.style.display = 'block';
        } else {
            alert('❌ No se pudo cargar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('⚠️ Error al cargar los datos del producto');
    }
}

/**
 * Cerrar modal
 */
function closeModal() {
    editModal.style.display = 'none';
    editForm.reset();
    editingProductId = null;
}

/**
 * Manejar envío de formulario de edición (UPDATE)
 */
async function handleEditSubmit(e) {
    e.preventDefault();

    if (!editingProductId) {
        editMessage.innerHTML = '<p class="error">❌ Error: No se especificó el producto a editar</p>';
        return;
    }

    const formData = new FormData(editForm);
    const productData = {
        id: editingProductId,
        product_name: formData.get('product_name'),
        description: formData.get('description'),
        quantity: formData.get('quantity'),
        unit_price: formData.get('unit_price')
    };

    if (!validateProductData(productData)) {
        editMessage.innerHTML = '<p class="error">❌ Por favor, rellene todos los campos correctamente</p>';
        return;
    }

    try {
        editMessage.innerHTML = '<p class="info">Actualizando producto...</p>';

        const response = await fetch(`${API_BASE_URL}/${editingProductId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (data.success) {
            editMessage.innerHTML = '<p class="success">✅ Producto actualizado exitosamente</p>';
            setTimeout(() => {
                closeModal();
                fetchAllProducts();
            }, 1500);
        } else {
            editMessage.innerHTML = '<p class="error">❌ ' + (data.message || 'Error al actualizar el producto') + '</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        editMessage.innerHTML = '<p class="error">⚠️ Error de conexión con el servidor</p>';
    }
}

/**
 * Eliminar un producto (DELETE)
 */
async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${productId}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showTableMessage('✅ Producto eliminado exitosamente', 'success');
            fetchAllProducts();
        } else {
            showTableMessage('❌ ' + (data.message || 'Error al eliminar el producto'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showTableMessage('⚠️ Error de conexión con el servidor', 'error');
    }
}

/**
 * Validar datos del producto
 */
function validateProductData(data) {
    if (!data.id || data.id <= 0) return false;
    if (!data.product_name || data.product_name.trim() === '') return false;
    if (!data.description || data.description.trim() === '') return false;
    if (data.quantity === null || data.quantity === '' || data.quantity < 0) return false;
    if (data.unit_price === null || data.unit_price === '' || data.unit_price < 0) return false;
    return true;
}

/**
 * Mostrar mensaje en sección de formulario
 */
function showFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `message-box show ${type}`;

    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            formMessage.classList.remove('show');
        }, 5000);
    }
}

/**
 * Mostrar mensaje en sección de tabla
 */
function showTableMessage(message, type) {
    tableMessage.textContent = message;
    tableMessage.className = `message-box show ${type}`;

    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            tableMessage.classList.remove('show');
        }, 5000);
    }
}

/**
 * Escapar caracteres HTML
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Formatear datetime
 */
function formatDateTime(datetime) {
    const date = new Date(datetime);
    return date.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Actualizar estadísticas
 */
function updateStats(products) {
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + parseInt(p.quantity), 0);
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);

    document.getElementById('totalProducts').textContent = totalProducts;
    document.getElementById('totalUnits').textContent = totalUnits;
    document.getElementById('totalValue').textContent = '$' + totalValue.toFixed(2);
}
