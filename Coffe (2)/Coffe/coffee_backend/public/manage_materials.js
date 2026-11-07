// CODE HOÀN CHỈNH CHO TRANG MANAGE_MATERIALS.HTML
document.addEventListener('DOMContentLoaded', () => {

    // --- Biến toàn cục ---
    let allMaterials = []; // Lưu trữ toàn bộ NVL

    // --- Lấy các phần tử Form ---
    const materialForm = document.getElementById('material-form');
    const formTitle = document.getElementById('material-form-title');
    const submitBtn = document.getElementById('material-form-submit-btn');
    const cancelBtn = document.getElementById('material-form-cancel-btn');
    const materialIdInput = document.getElementById('material-id');
    const materialNameInput = document.getElementById('material-name');
    const materialUnitInput = document.getElementById('material-unit');
    const materialSafetyStockInput = document.getElementById('material-safety-stock');
    
    // --- Lấy phần tử Danh sách ---
    const materialList = document.getElementById('material-list');
    const searchInput = document.getElementById('search-material-input'); // Ô tìm kiếm (MỚI)
    const logoutBtn = document.getElementById('logout-btn');

    // --- KHỞI CHẠY ---
    loadMaterials();

    // --- HÀM TẢI DỮ LIỆU ---
    function loadMaterials() {
        fetchWithToken('/api/materials')
            .then(res => res ? res.json() : null)
            .then(materials => {
                allMaterials = materials; // Lưu vào biến toàn cục
                renderMaterialList(allMaterials); // Vẽ ra bảng
            })
            .catch(error => console.error('Lỗi khi tải NVL:', error));
    }

    // --- HÀM MỚI: VẼ BẢNG ---
    // Tách riêng hàm vẽ bảng để gọi lại khi tìm kiếm
    function renderMaterialList(materialsToRender) {
        materialList.innerHTML = ''; // Xóa bảng cũ
        
        if (materialsToRender.length === 0) {
            materialList.innerHTML = '<tr><td colspan="5" class="text-center">Không tìm thấy NVL nào.</td></tr>';
            return;
        }

        materialsToRender.forEach(material => {
            const row = document.createElement('tr');
            
            if(material.stock_level <= material.safety_stock && material.stock_level > 0) {
                row.classList.add('table-warning'); // Cảnh báo vàng
            } else if (material.stock_level == 0) {
                 row.classList.add('table-danger'); // Báo động đỏ
            }

            row.innerHTML = `
                <td>${material.name}</td>
                <td>${material.unit}</td>
                <td><strong>${material.stock_level}</strong></td>
                <td>${material.safety_stock}</td>
                <td>
                    <button class="btn btn-warning btn-sm btn-edit">Sửa</button>
                    <button class="btn btn-danger btn-sm btn-delete">Xóa</button>
                </td>
            `;
            
            row.querySelector('.btn-edit').addEventListener('click', () => startEdit(material));
            row.querySelector('.btn-delete').addEventListener('click', () => deleteMaterial(material.id));
            
            materialList.appendChild(row);
        });
    }

    // --- HÀM MỚI: XỬ LÝ TÌM KIẾM ---
    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        // Lọc từ danh sách gốc
        const filteredMaterials = allMaterials.filter(material => 
            material.name.toLowerCase().includes(searchTerm)
        );
        // Vẽ lại bảng với kết quả đã lọc
        renderMaterialList(filteredMaterials);
    }

    // --- CÁC HÀM XỬ LÝ (CRUD) ---

    function deleteMaterial(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa NVL này?')) return;

        fetchWithToken(`/api/materials/${id}`, { method: 'DELETE' })
        .then(res => res ? res.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            loadMaterials(); // Tải lại toàn bộ
        })
        .catch(err => alert(`Xóa thất bại: ${err.message}`));
    }

    function startEdit(material) {
        formTitle.textContent = 'Sửa NVL';
        submitBtn.textContent = 'Cập nhật';
        cancelBtn.style.display = 'inline-block';
        
        materialIdInput.value = material.id;
        materialNameInput.value = material.name;
        materialUnitInput.value = material.unit;
        materialSafetyStockInput.value = material.safety_stock;
    }

    function cancelEdit() {
        formTitle.textContent = 'Thêm NVL mới';
        submitBtn.textContent = 'Lưu';
        cancelBtn.style.display = 'none';
        
        materialForm.reset();
        materialIdInput.value = '';
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        
        const id = materialIdInput.value;
        const isEditing = (id !== '');
        
        const materialData = {
            name: materialNameInput.value,
            unit: materialUnitInput.value,
            safety_stock: materialSafetyStockInput.value
        };

        const url = isEditing ? `/api/materials/${id}` : '/api/materials';
        const method = isEditing ? 'PUT' : 'POST';

        fetchWithToken(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(materialData)
        })
        .then(res => res ? res.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            loadMaterials(); // Tải lại
            cancelEdit();
        })
        .catch(err => alert(`Thao tác thất bại: ${err.message}`));
    }

    // --- GẮN SỰ KIỆN ---
    materialForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', cancelEdit);
    searchInput.addEventListener('input', handleSearch); // Gắn sự kiện tìm kiếm

    // --- LOGIC ĐĂNG XUẤT ---
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });

});