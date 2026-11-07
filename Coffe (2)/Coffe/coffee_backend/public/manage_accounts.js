document.addEventListener('DOMContentLoaded', () => {
    requireAdmin(); // Chủ động gọi kiểm tra quyền ở đây
    // Việc kiểm tra quyền admin đã được chuyển sang file auth.js

    // --- LẤY CÁC PHẦN TỬ ---
    const userListTbody = document.getElementById('user-list');
    const userModal = new bootstrap.Modal(document.getElementById('userModal'));
    const userForm = document.getElementById('user-form');
    const modalTitle = document.getElementById('user-modal-title');
    const userIdInput = document.getElementById('user-id');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const roleInput = document.getElementById('role');

    const logoutBtn = document.getElementById('logout-btn');

    let allRoles = []; // Biến để lưu danh sách vai trò

    // --- HÀM TẢI VAI TRÒ VÀ ĐIỀN VÀO DROPDOWN ---
    async function loadRolesAndPopulateDropdown() {
        try {
            const response = await fetchWithToken('/api/roles');
            if (!response || !response.ok) throw new Error('Không thể tải vai trò.');
            allRoles = await response.json();

            roleInput.innerHTML = '<option value="">-- Chọn vai trò --</option>';
            allRoles.forEach(role => {
                const option = document.createElement('option');
                option.value = role.id;
                option.textContent = role.name;
                roleInput.appendChild(option);
            });
        } catch (error) {
            console.error('Lỗi tải vai trò:', error);
            roleInput.innerHTML = '<option value="">Lỗi tải vai trò</option>';
        }
    }

    // --- HÀM TẢI VÀ HIỂN THỊ DANH SÁCH USER ---
    async function loadUsers() {
        try {
            const response = await fetchWithToken('/api/users');
            if (!response) return; // Dừng lại nếu token hết hạn và đã chuyển trang


            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Không thể đọc lỗi từ server.' }));
                throw new Error(errorData.message || `Lỗi HTTP: ${response.status}`);
            }

            const users = await response.json();
            
            userListTbody.innerHTML = '';
            users.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.id}</td>
                    <td>${u.username}</td>
                    <td><span class="badge bg-${u.role === 'admin' ? 'info' : 'secondary'}">${u.role}</span></td>
                    <td>
                        <button class="btn btn-sm btn-warning edit-btn" data-id="${u.id}">
                            <i class="bi bi-pencil"></i> Sửa
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${u.id}" data-username="${u.username}">
                            <i class="bi bi-trash"></i> Xóa
                        </button>
                    </td>
                `;
                userListTbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Lỗi tải danh sách người dùng:', error.message);
            alert('Không thể tải danh sách người dùng. ' + error.message);
        }
    }

    // --- XỬ LÝ SỰ KIỆN TRÊN DANH SÁCH USER (XÓA, SỬA) ---
    userListTbody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const userId = target.dataset.id;

        // Xử lý xóa
        if (target.classList.contains('delete-btn')) {
            const username = target.dataset.username;
            if (confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}"?`)) {
                try {
                    const response = await fetchWithToken(`/api/users/${userId}`, { method: 'DELETE' }); // API này chưa có
                    if (!response) return;

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: 'Không thể đọc lỗi từ server.' }));
                        throw new Error(errorData.message || `Lỗi HTTP: ${response.status}`);
                    }

                    const data = await response.json();
                    alert(data.message || 'Xóa thành công!');
                    loadUsers();
                } catch (error) {
                    alert('Xóa thất bại. ' + (error.message || ''));
                }
            }
        }

        // Xử lý sửa
        if (target.classList.contains('edit-btn')) {
            const response = await fetchWithToken(`/api/users/${userId}`); // API này chưa có
            if (!response) return;

            if (!response.ok) {
                throw new Error(`Không thể tải thông tin người dùng. Lỗi HTTP: ${response.status}`);
            }

            const userToEdit = await response.json();
            
            modalTitle.textContent = 'Chỉnh sửa tài khoản';
            userIdInput.value = userToEdit.id;
            usernameInput.value = userToEdit.username;
            roleInput.value = userToEdit.role_id; // SỬA Ở ĐÂY: Dùng role_id
            passwordInput.placeholder = "Để trống nếu không đổi mật khẩu";
            passwordInput.required = false; // Mật khẩu không bắt buộc khi sửa
            userModal.show();
        }
    });

    // --- XỬ LÝ FORM THÊM/SỬA USER ---
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = userIdInput.value;
        const isEditing = id !== '';

        const userData = {
            username: usernameInput.value,
            password: passwordInput.value,
            role_id: roleInput.value
        };

        // Không gửi mật khẩu rỗng
        if (!isEditing && !userData.password) {
            passwordInput.required = true;
            return alert('Vui lòng nhập mật khẩu cho người dùng mới.');
        }
        if (isEditing && !userData.password) {
            delete userData.password;
        }

        const url = isEditing ? `/api/users/${id}` : '/api/users';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetchWithToken(url, {
                method: method,
                body: JSON.stringify(userData)
            });
            if (!response) return;

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Không thể đọc lỗi từ server.' }));
                throw new Error(errorData.error || errorData.message || `Lỗi HTTP: ${response.status}`);
            }

            const data = await response.json();
            alert(data.message || 'Thao tác thành công!');
            userModal.hide();
            loadUsers();
        } catch (error) {
            alert('Thao tác thất bại. ' + (error.message || ''));
        }
    });

    // Reset form khi modal được đóng
    document.getElementById('userModal').addEventListener('hidden.bs.modal', () => {
        userForm.reset();
        userIdInput.value = '';
        modalTitle.textContent = 'Thêm tài khoản mới';
        passwordInput.required = true;
        passwordInput.placeholder = "";
    });

    // --- ĐĂNG XUẤT ---
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // Tải danh sách user khi trang được mở
    loadRolesAndPopulateDropdown(); // Tải vai trò trước
    loadUsers();
});
