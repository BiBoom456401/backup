// CODE HOÀN CHỈNH CHO TRANG MANAGE_IMPORTS.HTML (ĐÃ DỌN DẸP)
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Biến toàn cục ---
    let importItems = []; 
    let allMaterials = [];
    let allSuppliers = [];

    // --- Lấy các phần tử Form chính ---
    const importForm = document.getElementById('import-form');
    const supplierSelect = document.getElementById('import-supplier');
    const importDateInput = document.getElementById('import-date');
    const importNoteInput = document.getElementById('import-note');
    const totalCostSpan = document.getElementById('import-total-cost');

    // --- Lấy các phần tử Form thêm hàng ---
    const addItemForm = document.getElementById('add-item-form');
    const materialSelect = document.getElementById('import-material');
    const quantityInput = document.getElementById('import-quantity');
    const costInput = document.getElementById('import-cost');
    const addItemBtn = document.getElementById('add-item-btn');
    const importItemsList = document.getElementById('import-items-list');
    const logoutBtn = document.getElementById('logout-btn');

    // --- KHÔNG CÒN LỊCH SỬ HAY MODAL Ở ĐÂY ---

    // --- KHỞI CHẠY ---
    importDateInput.value = new Date().toISOString().split('T')[0];
    
    // Tải song song NVL và NCC
    Promise.all([
        fetchWithToken('/api/materials').then(res => res ? res.json() : null),
        fetchWithToken('/api/suppliers').then(res => res ? res.json() : null)
    ])
    .then(([materials, suppliers]) => {
        allMaterials = materials;
        allSuppliers = suppliers;
        
        materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material.id;
            option.textContent = `${material.name} (${material.unit})`;
            materialSelect.appendChild(option);
        });
        
        suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.id;
            option.textContent = supplier.name;
            supplierSelect.appendChild(option);
        });
    })
    .catch(error => console.error('Lỗi khi tải dữ liệu ban đầu:', error));

    // --- CÁC HÀM XỬ LÝ PHIẾU TẠM ---
    function addItemToImport() {
        const materialId = parseInt(materialSelect.value);
        const quantity = parseFloat(quantityInput.value);
        const costPrice = parseFloat(costInput.value);

        if (!materialId || isNaN(quantity) || isNaN(costPrice) || quantity <= 0 || costPrice < 0) {
            alert('Vui lòng nhập đủ thông tin NVL, số lượng > 0 và đơn giá >= 0.');
            return;
        }

        const material = allMaterials.find(m => m.id === materialId);
        if (!material) return;

        importItems.push({
            cartId: Date.now(),
            material_id: materialId,
            name: material.name,
            unit: material.unit,
            quantity: quantity,
            cost_price: costPrice
        });

        renderImportList();
        materialSelect.value = ""; 
        quantityInput.value = "";
        costInput.value = "";
    }

    function renderImportList() {
        importItemsList.innerHTML = '';
        let totalCost = 0;

        importItems.forEach(item => {
            const row = document.createElement('tr');
            const subtotal = item.quantity * item.cost_price;
            totalCost += subtotal;

            row.innerHTML = `
                <td>${item.name} (${item.unit})</td>
                <td>${item.quantity}</td>
                <td>${item.cost_price.toLocaleString('vi-VN')}</td>
                <td>${subtotal.toLocaleString('vi-VN')}</td>
                <td><button type="button" class="btn btn-danger btn-sm btn-delete-item">Xóa</button></td>
            `;

            row.querySelector('.btn-delete-item').addEventListener('click', () => {
                importItems = importItems.filter(i => i.cartId !== item.cartId);
                renderImportList(); 
            });
            importItemsList.appendChild(row);
        });
        totalCostSpan.textContent = `${totalCost.toLocaleString('vi-VN')} VNĐ`;
    }

    // --- KHÔNG CÒN CÁC HÀM XỬ LÝ LỊCH SỬ ---

    // --- HÀM GỬI PHIẾU NHẬP ---
    function handleFormSubmit(event) {
        event.preventDefault();
        if (importItems.length === 0) {
            alert('Bạn phải thêm ít nhất 1 nguyên vật liệu vào phiếu nhập.');
            return;
        }
        const importData = {
            supplier_id: supplierSelect.value || null,
            order_date: importDateInput.value,
            note: importNoteInput.value,
            items: importItems 
        };

        fetchWithToken('/api/purchase-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(importData)
        })
        .then(res => res ? res.json() : null)
        .then(data => {
            if (data.error) throw new Error(data.error);
            alert(data.message);
            
            importItems = [];
            renderImportList();
            importForm.reset();
            importDateInput.value = new Date().toISOString().split('T')[0];
            
            // Không cần tải lại lịch sử ở đây nữa
        })
        .catch(err => {
            console.error('Lỗi khi lưu phiếu nhập:', err);
            alert(`Lưu thất bại: ${err.message}`);
        });
    }

    // --- GẮN SỰ KIỆN ---
    addItemBtn.addEventListener('click', addItemToImport);
    importForm.addEventListener('submit', handleFormSubmit);

    // --- LOGIC ĐĂNG XUẤT ---
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Không còn sự kiện click lịch sử
});