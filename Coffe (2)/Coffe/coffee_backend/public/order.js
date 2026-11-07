// CODE HOÀN CHỈNH CHO TRANG INDEX.HTML (BÁN HÀNG)
document.addEventListener('DOMContentLoaded', () => {

    // Lấy thông tin user hiện tại
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Nếu user không tồn tại hoặc bị lỗi, chuyển về trang login
    if (!user) {
        window.location.href = 'login.html'; 
        return;
    }

    // --- Biến toàn cục ---
    let currentTable = null;
    let currentOrderItems = []; 
    let currentOrderId = null;
    let selectedProduct = null;
    let allProducts = [];
    let allCategories = [];
    
    // --- Lấy phần tử Giao diện ---
    const tableListUL = document.getElementById('table-list');
    const orderPanel = document.getElementById('order-panel');
    const selectedTableName = document.getElementById('selected-table-name');
    const currentOrderListUL = document.getElementById('current-order-list');
    const totalAmountSpan = document.getElementById('total-amount');
    const submitOrderBtn = document.getElementById('submit-order-btn');
    const payOrderBtn = document.getElementById('pay-order-btn');
    const searchInput = document.getElementById('search-input');
    const categoryTabs = document.getElementById('category-tabs');
    const productPanes = document.getElementById('product-panes');
    const logoutBtn = document.getElementById('logout-btn');


    // --- 1. CHỨC NĂNG PHÂN QUYỀN (HIỆN MENU CHO ADMIN) ---
    if (user.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'block'; // HIỆN TẤT CẢ menu cho admin
        });
    }


    // --- KHỞI CHẠY (GỘP CẢ TABLE VÀO ĐÂY) ---
    loadTables(); // TÁCH RA GỌI RIÊNG Ở ĐÂY

    Promise.all([
        fetchWithToken('/api/categories').then(res => res ? res.json() : null), 
        fetchWithToken('/api/products').then(res => res ? res.json() : null)
    ])
    .then(([categories, products]) => {
        if (!categories || !products) return; 

        allCategories = categories;
        allProducts = products;
        
        renderMenu(allProducts); 
        searchInput.addEventListener('input', handleSearch);
    })
    .catch(error => {
        console.error('Lỗi nghiêm trọng khi tải menu:', error);
        productPanes.innerHTML = '<p class="text-danger">Không thể tải thực đơn.</p>';
    });

    orderPanel.style.display = 'none';

    // --- HÀM TẢI DỮ LIỆU ---

    function renderMenu(productsToRender) {
        categoryTabs.innerHTML = '';
        productPanes.innerHTML = '';

        const allTab = document.createElement('li');
        allTab.className = 'nav-item';
        allTab.innerHTML = `<button class="nav-link active" id="tab-all" data-bs-toggle="tab" data-bs-target="#pane-all" type="button">Tất cả</button>`;
        categoryTabs.appendChild(allTab);

        const allPane = document.createElement('div');
        allPane.className = 'tab-pane fade show active';
        allPane.id = 'pane-all';
        allPane.innerHTML = '<div class="row g-3"></div>'; 
        productPanes.appendChild(allPane);

        allCategories.forEach(category => {
            const productsInCategory = productsToRender.filter(p => p.category_id === category.id);
            if (productsInCategory.length === 0) return; 

            const catTab = document.createElement('li');
            catTab.className = 'nav-item';
            catTab.innerHTML = `<button class="nav-link" id="tab-${category.id}" data-bs-toggle="tab" data-bs-target="#pane-${category.id}" type="button">${category.name}</button>`;
            categoryTabs.appendChild(catTab);

            const catPane = document.createElement('div');
            catPane.className = 'tab-pane fade';
            catPane.id = `pane-${category.id}`;
            catPane.innerHTML = '<div class="row g-3"></div>';
            productPanes.appendChild(catPane);
        });

        const allPaneRow = allPane.querySelector('.row');
        
        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'col-lg-3 col-md-4 col-6';
            
            productCard.innerHTML = `
                <div class="card h-100 product-card shadow-sm">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text text-muted">${product.category_name || 'Chưa phân loại'}</p>
                    </div>
                </div>
            `;
            
            productCard.querySelector('.product-card').addEventListener('click', () => {
                openSizeModal(product);
            });

            allPaneRow.appendChild(productCard);

            const categoryPaneRow = document.querySelector(`#pane-${product.category_id} .row`);
            if (categoryPaneRow) {
                const clonedCard = productCard.cloneNode(true); 
                clonedCard.querySelector('.product-card').addEventListener('click', () => {
                    openSizeModal(product);
                });
                categoryPaneRow.appendChild(clonedCard);
            }
        });
    }

    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredProducts = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm));
        renderMenu(filteredProducts);
    }
            
    // HÀM TẢI BÀN (ĐÃ SỬA LỖI)
    function loadTables() {
        return fetchWithToken('/api/tables') // SỬA Ở ĐÂY: Dùng fetchWithToken
            .then(response => response ? response.json() : null)
            .then(tables => {
                if (!tables) return;
                tableListUL.innerHTML = ''; 
                tables.forEach(table => {
                    const li = document.createElement('li');
                    li.textContent = `${table.name}`;
                    li.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
                    const statusBadge = document.createElement('span');
                    statusBadge.className = table.status === 'trống' ? 'badge bg-success' : 'badge bg-danger';
                    statusBadge.textContent = table.status;
                    li.appendChild(statusBadge);
                    li.addEventListener('click', () => {
                        selectTable(table);
                    });
                    tableListUL.appendChild(li);
                });
            })
            .catch(error => {
                console.error('Lỗi khi tải danh sách bàn:', error);
                tableListUL.innerHTML = '<li class="list-group-item text-danger">Không thể tải danh sách bàn.</li>';
            });
    }
    
    // --- CÁC HÀM XỬ LÝ MODAL & ORDER ---

    // Lấy các phần tử trong Modal
    const sizeModal = new bootstrap.Modal(document.getElementById('size-modal'));
    const modalProductName = document.getElementById('modal-product-name');
    const modalSizeOptions = document.getElementById('modal-size-options');
    const modalNoteInput = document.getElementById('modal-note');
    const modalAddToCartBtn = document.getElementById('modal-add-to-cart-btn');

    // Mở modal chọn size
    function openSizeModal(product) {
        if (!currentTable) {
            alert("Vui lòng chọn bàn trước khi thêm món!");
            return;
        }
        selectedProduct = product;
        modalProductName.textContent = product.name;
        modalSizeOptions.innerHTML = '';
        modalNoteInput.value = '';

        if (product.variants && product.variants.length > 0) {
            product.variants.forEach(variant => {
                const button = document.createElement('button');
                button.className = 'btn btn-outline-primary';
                button.textContent = `${variant.size} - ${variant.price.toLocaleString('vi-VN')}đ`;
                button.onclick = () => handleModalAddToCart(variant);
                modalSizeOptions.appendChild(button);
            });
        } else {
            modalSizeOptions.innerHTML = '<p>Sản phẩm này chưa có giá. Vui lòng liên hệ quản lý.</p>';
        }
        sizeModal.show();
    }

    // Thêm món từ modal vào giỏ hàng tạm
    function handleModalAddToCart(variant) {
        const newItem = {
            cartId: Date.now(),
            id: selectedProduct.id,
            name: selectedProduct.name,
            quantity: 1,
            price: variant.price,
            size: variant.size,
            note: modalNoteInput.value
        };
        currentOrderItems.push(newItem);
        updateOrderList();
        sizeModal.hide();
    }

    // Chọn bàn
    function selectTable(table) {
        currentTable = table;
        orderPanel.style.display = 'block';
        selectedTableName.textContent = table.name;

        // Reset trạng thái
        currentOrderItems = [];
        currentOrderId = null;

        if (table.status === 'có khách') {
            submitOrderBtn.style.display = 'none';
            payOrderBtn.style.display = 'block';
            loadActiveOrder(table.id);
        } else { // Bàn trống
            submitOrderBtn.style.display = 'block';
            payOrderBtn.style.display = 'none';
            updateOrderList();
        }
    }

    // Giảm số lượng
    function decreaseItemQuantity(cartId) {
        const item = currentOrderItems.find(i => i.cartId === cartId);
        if (item) {
            item.quantity--;
            if (item.quantity === 0) {
                currentOrderItems = currentOrderItems.filter(i => i.cartId !== cartId);
            }
            updateOrderList();
        }
    }

    // Tăng số lượng
    function increaseItemQuantity(cartId) {
        const item = currentOrderItems.find(i => i.cartId === cartId);
        if (item) {
            item.quantity++;
            updateOrderList();
        }
    }

    // Cập nhật lại danh sách món trong đơn hàng
    function updateOrderList() {
        currentOrderListUL.innerHTML = '';
        let total = 0;
        currentOrderItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    <strong>${item.name}</strong> (${item.size})
                    ${item.note ? `<br><small class="text-muted">Ghi chú: ${item.note}</small>` : ''}
                </div>
                <div>
                    <button class="btn btn-sm btn-secondary decrease-btn">-</button>
                    <span class="mx-2">${item.quantity}</span>
                    <button class="btn btn-sm btn-secondary increase-btn">+</button>
                    <span class="ms-3">${(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                </div>
            `;
            li.querySelector('.decrease-btn').onclick = () => decreaseItemQuantity(item.cartId);
            li.querySelector('.increase-btn').onclick = () => increaseItemQuantity(item.cartId);
            currentOrderListUL.appendChild(li);
            total += item.price * item.quantity;
        });
        totalAmountSpan.textContent = total.toLocaleString('vi-VN');
    }

    // Tải đơn hàng đang hoạt động của bàn
    function loadActiveOrder(tableId) {
        fetchWithToken(`/api/orders/table/${tableId}`)
            .then(res => res ? res.json() : null)
            .then(data => {
                if (!data || data.error) return;
                currentOrderId = data.orderId;
                currentOrderItems = data.items.map(item => ({ ...item, cartId: Date.now() + Math.random() }));
                updateOrderList();
            })
            .catch(err => console.error('Lỗi tải đơn hàng cũ:', err));
    }
    
    // Gắn sự kiện cho nút "Thêm vào đơn" TRONG MODAL
    modalAddToCartBtn.addEventListener('click', handleModalAddToCart);
    
    // API TẠO ĐƠN HÀNG (SỬ DỤNG fetchWithToken)
    submitOrderBtn.addEventListener('click', () => {
        if (currentOrderItems.length === 0) return alert("Vui lòng thêm món vào đơn");
        const total = currentOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const orderData = {
            table_id: currentTable.id,
            items: currentOrderItems.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
                note: item.note
            })),
            total_amount: total
        };
        
        fetchWithToken('/api/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        })
        .then(response => response ? response.json() : null)
        .then(data => {
            if (!data) return;
            if (data.error) throw new Error(data.error);
            alert(data.message); 
            loadTables(); 
            orderPanel.style.display = 'none'; 
        })
        .catch(error => alert(`Tạo đơn hàng thất bại: ${error.message}`));
    });

    // API THANH TOÁN (SỬ DỤNG fetchWithToken)
    payOrderBtn.addEventListener('click', () => {
        const paymentData = {
            orderId: currentOrderId,
            tableId: currentTable.id
        };
        fetchWithToken('/api/orders/pay', {
            method: 'PUT',
            body: JSON.stringify(paymentData),
        })
        .then(response => response ? response.json() : null)
        .then(data => {
            if (!data) return;
            if (data.error) throw new Error(data.error);
            alert(data.message);
            loadTables(); 
            orderPanel.style.display = 'none'; 
        })
        .catch(error => alert(`Thanh toán thất bại: ${error.message}`));
    });
    
    // --- LOGIC ĐĂNG XUẤT ---
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });
});