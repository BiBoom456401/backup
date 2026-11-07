document.addEventListener('DOMContentLoaded', () => {
    // --- Biến toàn cục ---
    let tableInfo = null;
    let allProducts = [];
    let allCategories = [];
    let cart = [];
    let selectedProduct = null;

    // --- Lấy các phần tử Giao diện ---
    const tableNameEl = document.getElementById('table-name');
    const searchInput = document.getElementById('search-input');
    const categoryTabs = document.getElementById('category-tabs');
    const productPanes = document.getElementById('product-panes');
    const cartItemCountBadge = document.getElementById('cart-item-count');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalAmountEl = document.getElementById('cart-total-amount');
    const sendOrderBtn = document.getElementById('send-order-btn');

    // --- Modal ---
    const sizeModal = new bootstrap.Modal(document.getElementById('size-modal'));
    const modalProductName = document.getElementById('modal-product-name');
    const modalSizeOptions = document.getElementById('modal-size-options');
    const modalNoteInput = document.getElementById('modal-note');

    // --- KHỞI TẠO ---
    async function initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const tableId = urlParams.get('table_id');

        if (!tableId) {
            document.body.innerHTML = '<div class="alert alert-danger m-5">Lỗi: Không tìm thấy thông tin bàn. Vui lòng quét lại mã QR.</div>';
            return;
        }

        try {
            const response = await fetch(`/api/customer/menu/${tableId}`);
            if (!response.ok) throw new Error('Không thể tải thực đơn.');
            const data = await response.json();

            tableInfo = data.table;
            allProducts = data.products;
            allCategories = data.categories;

            tableNameEl.textContent = tableInfo.name;
            renderMenu(allProducts);

        } catch (error) {
            document.body.innerHTML = `<div class="alert alert-danger m-5">Lỗi: ${error.message}</div>`;
        }
    }

    // --- CÁC HÀM VẼ GIAO DIỆN ---
    function renderMenu(productsToRender) {
        categoryTabs.innerHTML = '';
        productPanes.innerHTML = '';

        const allTab = document.createElement('li');
        allTab.className = 'nav-item';
        allTab.innerHTML = `<button class="nav-link active" data-bs-toggle="tab" data-bs-target="#pane-all">Tất cả</button>`;
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
            catTab.innerHTML = `<button class="nav-link" data-bs-toggle="tab" data-bs-target="#pane-${category.id}">${category.name}</button>`;
            categoryTabs.appendChild(catTab);

            const catPane = document.createElement('div');
            catPane.className = 'tab-pane fade';
            catPane.id = `pane-${category.id}`;
            catPane.innerHTML = '<div class="row g-3"></div>';
            productPanes.appendChild(catPane);
        });

        productsToRender.forEach(product => {
            const productCardHTML = `
                <div class="col-lg-3 col-md-4 col-6">
                    <div class="card h-100 product-card shadow-sm">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text text-muted">${product.category_name || 'Chưa phân loại'}</p>
                        </div>
                    </div>
                </div>`;

            const allPaneRow = allPane.querySelector('.row');
            const productCard = document.createElement('div');
            productCard.innerHTML = productCardHTML;
            productCard.querySelector('.product-card').addEventListener('click', () => openSizeModal(product));
            allPaneRow.appendChild(productCard.firstElementChild);

            const categoryPaneRow = document.querySelector(`#pane-${product.category_id} .row`);
            if (categoryPaneRow) {
                const clonedCard = document.createElement('div');
                clonedCard.innerHTML = productCardHTML;
                clonedCard.querySelector('.product-card').addEventListener('click', () => openSizeModal(product));
                categoryPaneRow.appendChild(clonedCard.firstElementChild);
            }
        });
    }

    function renderCart() {
        cartItemsList.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsList.innerHTML = '<li class="list-group-item text-center text-muted">Giỏ hàng trống</li>';
        } else {
            cart.forEach(item => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.innerHTML = `
                    <div><strong>${item.name}</strong> (${item.size}) x ${item.quantity}</div>
                    <small class="text-muted">${(item.price * item.quantity).toLocaleString('vi-VN')}đ</small>
                `;
                cartItemsList.appendChild(li);
                total += item.price * item.quantity;
            });
        }
        cartItemCountBadge.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartTotalAmountEl.textContent = total.toLocaleString('vi-VN') + 'đ';
    }

    // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---
    function openSizeModal(product) {
        selectedProduct = product;
        modalProductName.textContent = product.name;
        modalSizeOptions.innerHTML = '';
        modalNoteInput.value = '';

        if (product.variants && product.variants.length > 0) {
            product.variants.forEach(variant => {
                const button = document.createElement('button');
                button.className = 'btn btn-outline-primary';
                button.textContent = `${variant.size} - ${variant.price.toLocaleString('vi-VN')}đ`;
                button.onclick = () => addToCart(variant);
                modalSizeOptions.appendChild(button);
            });
        } else {
            modalSizeOptions.innerHTML = '<p>Sản phẩm này chưa có giá.</p>';
        }
        sizeModal.show();
    }

    function addToCart(variant) {
        const newItem = {
            id: selectedProduct.id,
            name: selectedProduct.name,
            quantity: 1,
            price: variant.price,
            size: variant.size,
            note: modalNoteInput.value
        };
        cart.push(newItem);
        renderCart();
        sizeModal.hide();
    }

    async function handleSendOrder() {
        if (cart.length === 0) {
            alert('Giỏ hàng của bạn đang trống.');
            return;
        }

        sendOrderBtn.disabled = true;
        sendOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang gửi...';

        const orderData = {
            table_id: tableInfo.id,
            items: cart,
            total_amount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };

        try {
            const response = await fetch('/api/customer/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Gửi đơn hàng thất bại.');

            alert('Gửi đơn hàng thành công! Vui lòng chờ nhân viên xác nhận.');
            window.location.reload(); // Tải lại trang sau khi gửi

        } catch (error) {
            alert(`Lỗi: ${error.message}`);
            sendOrderBtn.disabled = false;
            sendOrderBtn.textContent = 'Gửi Order đến quầy';
        }
    }

    searchInput.addEventListener('input', () => renderMenu(allProducts.filter(p => p.name.toLowerCase().includes(searchInput.value.toLowerCase()))));
    sendOrderBtn.addEventListener('click', handleSendOrder);

    initialize();
});