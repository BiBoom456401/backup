document.addEventListener('DOMContentLoaded', () => {
    const roleListUL = document.getElementById('role-list');
    const roleForm = document.getElementById('role-form');
    const formTitle = document.getElementById('role-form-title');
    const submitBtn = document.getElementById('role-form-submit-btn');
    const cancelBtn = document.getElementById('role-form-cancel-btn');
    const roleIdInput = document.getElementById('role-id');
    const roleNameInput = document.getElementById('role-name');
    const roleDescriptionInput = document.getElementById('role-description');
    const logoutBtn = document.getElementById('logout-btn');

    function loadRoles() {
        fetchWithToken('/api/roles')
            .then(res => res ? res.json() : null)
            .then(roles => {
                roleListUL.innerHTML = '';
                roles.forEach(role => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-start';
                    li.innerHTML = `
                        <div class="ms-2 me-auto">
                            <div class="fw-bold">${role.name}</div>
                            ${role.description || ''}
                        </div>
                        <div>
                            <button class="btn btn-warning btn-sm btn-edit">Sửa</button>
                            <button class="btn btn-danger btn-sm btn-delete">Xóa</button>
                        </div>
                    `;
                    li.querySelector('.btn-edit').addEventListener('click', () => startEdit(role));
                    li.querySelector('.btn-delete').addEventListener('click', () => deleteRole(role.id, role.name));
                    roleListUL.appendChild(li);
                });
            });
    }

    function deleteRole(id, name) {
        if (name === 'admin') {
            return alert('Không thể xóa vai trò "admin".');
        }
        if (!confirm(`Bạn có chắc muốn xóa vai trò "${name}"?`)) return;
        fetchWithToken(`/api/roles/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                alert(data.message);
                loadRoles();
            })
            .catch(err => alert(`Xóa thất bại: ${err.message}`));
    }

    function startEdit(role) {
        formTitle.textContent = 'Sửa vai trò';
        submitBtn.textContent = 'Cập nhật';
        cancelBtn.style.display = 'inline-block';
        roleIdInput.value = role.id;
        roleNameInput.value = role.name;
        roleDescriptionInput.value = role.description;
    }

    function cancelEdit() {
        formTitle.textContent = 'Thêm vai trò mới';
        submitBtn.textContent = 'Lưu';
        cancelBtn.style.display = 'none';
        roleForm.reset();
        roleIdInput.value = '';
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const id = roleIdInput.value;
        const isEditing = id !== '';
        const roleData = {
            name: roleNameInput.value,
            description: roleDescriptionInput.value
        };
        const url = isEditing ? `/api/roles/${id}` : '/api/roles';
        const method = isEditing ? 'PUT' : 'POST';

        fetchWithToken(url, {
            method: method,
            body: JSON.stringify(roleData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            alert(data.message);
            loadRoles();
            cancelEdit();
        })
        .catch(err => alert(`Thao tác thất bại: ${err.message}`));
    }

    roleForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', cancelEdit);
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });

    loadRoles();
});
