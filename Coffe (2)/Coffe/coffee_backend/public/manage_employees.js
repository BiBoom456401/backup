document.addEventListener('DOMContentLoaded', () => {
    requireAdmin(); // Chủ động gọi kiểm tra quyền ở đây

    // --- LẤY CÁC PHẦN TỬ ---
    const employeeListTbody = document.getElementById('employee-list');
    const employeeModal = new bootstrap.Modal(document.getElementById('employeeModal'));
    const employeeForm = document.getElementById('employee-form');
    const modalTitle = document.getElementById('employee-modal-title');
    const employeeIdInput = document.getElementById('employee-id');
    const fullNameInput = document.getElementById('full-name');
    const dobInput = document.getElementById('date-of-birth');
    const addressInput = document.getElementById('address');
    const phoneInput = document.getElementById('phone-number');
    const salaryInput = document.getElementById('salary');
    const positionTitleInput = document.getElementById('position-title');
    const logoutBtn = document.getElementById('logout-btn');

    // --- HÀM TẢI VÀ HIỂN THỊ DANH SÁCH NHÂN VIÊN ---
    async function loadEmployees() {
        try {
            const response = await fetchWithToken('/api/employees'); // SỬA: Dùng API mới
            if (!response || !response.ok) {
                throw new Error('Không thể tải danh sách nhân viên.');
            }
            const employees = await response.json();
            
            employeeListTbody.innerHTML = '';
            employees.forEach(emp => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${emp.id}</td>
                    <td>${emp.full_name || ''}</td>
                    <td>${emp.phone_number || ''}</td>
                    <td>${emp.position_title || ''}</td>
                    <td>${emp.salary ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(emp.salary) : ''}</td>
                    <td>
                        <button class="btn btn-sm btn-warning edit-btn" data-id="${emp.id}">
                            <i class="bi bi-pencil"></i> Sửa
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${emp.id}" data-username="${emp.full_name}">
                            <i class="bi bi-trash"></i> Xóa
                        </button>
                    </td>
                `;
                employeeListTbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Lỗi tải danh sách nhân viên:', error.message);
            alert('Không thể tải danh sách nhân viên. ' + error.message);
        }
    }

    // --- XỬ LÝ SỰ KIỆN TRÊN DANH SÁCH (XÓA, SỬA) ---
    employeeListTbody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const employeeId = target.dataset.id;

        // Xử lý xóa
        if (target.classList.contains('delete-btn')) {
            const username = target.dataset.username;
            if (confirm(`Bạn có chắc chắn muốn xóa nhân viên "${username}"?`)) {
                try {
                    const response = await fetchWithToken(`/api/employees/${employeeId}`, { method: 'DELETE' }); // SỬA: Dùng API mới
                    if (!response || !response.ok) {
                         const errorData = await response.json().catch(() => ({ message: 'Xóa thất bại.' }));
                        throw new Error(errorData.error || errorData.message);
                    }
                    const data = await response.json();
                    alert(data.message || 'Xóa thành công!');
                    loadEmployees();
                } catch (error) {
                    alert('Lỗi: ' + error.message);
                }
            }
        }

        // Xử lý sửa
        if (target.classList.contains('edit-btn')) {
            const response = await fetchWithToken(`/api/employees/${employeeId}`); // SỬA: Dùng API mới
            if (!response || !response.ok) {
                return alert(`Không thể tải thông tin nhân viên. Lỗi HTTP: ${response.status}`);
            }
            const empToEdit = await response.json();
            
            modalTitle.textContent = 'Chỉnh sửa thông tin nhân viên';
            employeeIdInput.value = empToEdit.id;
            fullNameInput.value = empToEdit.full_name;
            dobInput.value = empToEdit.date_of_birth;
            phoneInput.value = empToEdit.phone_number;
            addressInput.value = empToEdit.address;
            salaryInput.value = empToEdit.salary;
            positionTitleInput.value = empToEdit.position_title;
            employeeModal.show();
        }
    });

    // --- XỬ LÝ FORM THÊM/SỬA ---
    employeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = employeeIdInput.value;
        const isEditing = id !== '';

        const employeeData = {
            full_name: fullNameInput.value,
            date_of_birth: dobInput.value,
            address: addressInput.value,
            phone_number: phoneInput.value,
            salary: salaryInput.value,
            position_title: positionTitleInput.value
        };
        // Khi thêm mới, tự động gán mật khẩu mặc định ở backend
        if (!isEditing) { employeeData.password = '123'; }

        const url = isEditing ? `/api/employees/${id}` : '/api/employees'; // SỬA: Dùng API mới
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetchWithToken(url, {
                method: method,
                body: JSON.stringify(employeeData)
            });
            if (!response || !response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Thao tác thất bại.' }));
                throw new Error(errorData.error || errorData.message);
            }
            const data = await response.json();
            alert(data.message || 'Thao tác thành công!');
            employeeModal.hide();
            loadEmployees();
        } catch (error) {
            alert('Lỗi: ' + error.message);
        }
    });

    // Reset form khi modal được đóng
    document.getElementById('employeeModal').addEventListener('hidden.bs.modal', () => {
        employeeForm.reset();
        employeeIdInput.value = '';
        modalTitle.textContent = 'Thêm Nhân viên mới';
    });

    // --- ĐĂNG XUẤT ---
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // --- TẢI DỮ LIỆU BAN ĐẦU ---
    loadEmployees();
});