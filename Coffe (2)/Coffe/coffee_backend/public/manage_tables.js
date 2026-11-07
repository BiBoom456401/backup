document.addEventListener('DOMContentLoaded', () => {
    requireAdmin(); // Kiểm tra quyền admin

    // --- LẤY CÁC PHẦN TỬ ---
    const tableListUL = document.getElementById('table-list');
    const tableForm = document.getElementById('table-form');
    const tableIdInput = document.getElementById('table-id');
    const tableNameInput = document.getElementById('table-name');
    const formTitle = document.getElementById('table-form-title');
    const submitBtn = document.getElementById('table-form-submit-btn');
    const cancelBtn = document.getElementById('table-form-cancel-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // --- HÀM TẢI VÀ HIỂN THỊ DANH SÁCH BÀN ---
    async function loadTables() {
        try {
            const response = await fetchWithToken('/api/tables');
            if (!response || !response.ok) {
                throw new Error('Không thể tải danh sách bàn.');
            }
            const tables = await response.json();

            tableListUL.innerHTML = ''; // Xóa danh sách cũ
            if (tables.length === 0) {
                tableListUL.innerHTML = '<li class="list-group-item">Chưa có bàn nào.</li>';
                return;
            }

            tables.forEach(table => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.innerHTML = `
                    <span>${table.name}</span>
                    <div>
                        <button class="btn btn-warning btn-sm edit-btn" data-id="${table.id}" data-name="${table.name}">Sửa</button>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${table.id}" data-name="${table.name}">Xóa</button>
                    </div>
                `;
                tableListUL.appendChild(li);
            });
        } catch (error) {
            console.error('Lỗi tải danh sách bàn:', error);
            alert(error.message);
        }
    }

    // --- HÀM XỬ LÝ FORM THÊM/SỬA ---
    async function handleFormSubmit(e) {
        e.preventDefault();
        const id = tableIdInput.value;
        const name = tableNameInput.value;
        const isEditing = id !== '';

        const url = isEditing ? `/api/tables/${id}` : '/api/tables';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetchWithToken(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            });

            if (!response || !response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Thao tác thất bại.' }));
                throw new Error(errorData.error || errorData.message);
            }

            const result = await response.json();
            alert(result.message);
            resetForm();
            loadTables();
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    }

    // --- HÀM XỬ LÝ CÁC NÚT BẤM TRÊN DANH SÁCH ---
    function handleListClick(e) {
        const target = e.target;
        const id = target.dataset.id;
        const name = target.dataset.name;

        // Nút Sửa
        if (target.classList.contains('edit-btn')) {
            tableIdInput.value = id;
            tableNameInput.value = name;
            formTitle.textContent = 'Chỉnh sửa bàn';
            submitBtn.textContent = 'Cập nhật';
            cancelBtn.style.display = 'inline-block';
        }

        // Nút Xóa
        if (target.classList.contains('delete-btn')) {
            if (confirm(`Bạn có chắc chắn muốn xóa "${name}"?`)) {
                fetchWithToken(`/api/tables/${id}`, { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.error) throw new Error(data.error);
                        alert(data.message);
                        loadTables();
                    })
                    .catch(err => alert('Lỗi: ' + err.message));
            }
        }
    }

    // --- HÀM TIỆN ÍCH ---
    function resetForm() {
        tableForm.reset();
        tableIdInput.value = '';
        formTitle.textContent = 'Thêm bàn mới';
        submitBtn.textContent = 'Thêm';
        cancelBtn.style.display = 'none';
    }

    // --- GẮN SỰ KIỆN ---
    tableForm.addEventListener('submit', handleFormSubmit);
    tableListUL.addEventListener('click', handleListClick);
    cancelBtn.addEventListener('click', resetForm);
    logoutBtn.addEventListener('click', () => { localStorage.clear(); window.location.href = 'login.html'; });

    // --- TẢI DỮ LIỆU BAN ĐẦU ---
    loadTables();
});