// CODE HOÀN CHỈNH CHO TRANG MANAGE_SUPPLIERS.HTML
document.addEventListener('DOMContentLoaded', () => {

    // Lấy các phần tử Form
    const supplierForm = document.getElementById('supplier-form');
    const formTitle = document.getElementById('supplier-form-title');
    const submitBtn = document.getElementById('supplier-form-submit-btn');
    const cancelBtn = document.getElementById('supplier-form-cancel-btn');
    const supplierIdInput = document.getElementById('supplier-id');
    const supplierNameInput = document.getElementById('supplier-name');
    const supplierPhoneInput = document.getElementById('supplier-phone');
    const supplierEmailInput = document.getElementById('supplier-email');
    const supplierAddressInput = document.getElementById('supplier-address');
    
    // Lấy danh sách
    const supplierList = document.getElementById('supplier-list');
    const logoutBtn = document.getElementById('logout-btn');

    // --- KHỞI CHẠY ---
    loadSuppliers();

    // --- HÀM TẢI DỮ LIỆU ---
    function loadSuppliers() {
        fetchWithToken('/api/suppliers')
            .then(res => res ? res.json() : null)
            .then(suppliers => {
                supplierList.innerHTML = '';
                suppliers.forEach(supplier => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${supplier.name}</td>
                        <td>${supplier.phone || ''}</td>
                        <td>${supplier.email || ''}</td>
                        <td>
                            <button class="btn btn-warning btn-sm btn-edit">Sửa</button>
                            <button class="btn btn-danger btn-sm btn-delete">Xóa</button>
                        </td>
                    `;
                    
                    // Gắn sự kiện cho nút Sửa/Xóa
                    row.querySelector('.btn-edit').addEventListener('click', () => startEdit(supplier));
                    row.querySelector('.btn-delete').addEventListener('click', () => deleteSupplier(supplier.id));
                    
                    supplierList.appendChild(row);
                });
            })
            .catch(error => console.error('Lỗi khi tải nhà cung cấp:', error));
    }

    // --- CÁC HÀM XỬ LÝ (CRUD) ---

    function deleteSupplier(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa nhà cung cấp này?')) return;

        fetchWithToken(`/api/suppliers/${id}`, { method: 'DELETE' })
        .then(res => res ? res.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            loadSuppliers();
        })
        .catch(err => alert(`Xóa thất bại: ${err.message}`));
    }

    function startEdit(supplier) {
        formTitle.textContent = 'Sửa nhà cung cấp';
        submitBtn.textContent = 'Cập nhật';
        cancelBtn.style.display = 'inline-block';
        
        supplierIdInput.value = supplier.id;
        supplierNameInput.value = supplier.name;
        supplierPhoneInput.value = supplier.phone;
        supplierEmailInput.value = supplier.email;
        supplierAddressInput.value = supplier.address;
    }

    function cancelEdit() {
        formTitle.textContent = 'Thêm nhà cung cấp';
        submitBtn.textContent = 'Lưu';
        cancelBtn.style.display = 'none';
        
        supplierForm.reset();
        supplierIdInput.value = '';
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        
        const id = supplierIdInput.value;
        const isEditing = (id !== '');
        
        const supplierData = {
            name: supplierNameInput.value,
            phone: supplierPhoneInput.value,
            email: supplierEmailInput.value,
            address: supplierAddressInput.value
        };

        const url = isEditing ? `/api/suppliers/${id}` : '/api/suppliers';
        const method = isEditing ? 'PUT' : 'POST';

        fetchWithToken(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supplierData)
        })
        .then(res => res ? res.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            loadSuppliers();
            cancelEdit();
        })
        .catch(err => alert(`Thao tác thất bại: ${err.message}`));
    }

    // --- GẮN SỰ KIỆN ---
    supplierForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', cancelEdit);

    // --- LOGIC ĐĂNG XUẤT ---
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });
});