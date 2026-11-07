document.addEventListener('DOMContentLoaded', () => {
    requireAdmin();

    const shiftListUL = document.getElementById('shift-list');
    const shiftForm = document.getElementById('shift-form');
    const formTitle = document.getElementById('shift-form-title');
    const submitBtn = document.getElementById('shift-form-submit-btn');
    const cancelBtn = document.getElementById('shift-form-cancel-btn');
    const shiftIdInput = document.getElementById('shift-id');
    const shiftNameInput = document.getElementById('shift-name');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const lateThresholdInput = document.getElementById('late-threshold');
    const logoutBtn = document.getElementById('logout-btn');

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    function loadShifts() {
        fetchWithToken('/api/shifts')
            .then(res => res ? res.json() : null)
            .then(shifts => {
                if (!shifts) return;
                shiftListUL.innerHTML = '';
                if (shifts.length === 0) {
                    shiftListUL.innerHTML = '<li class="list-group-item">Chưa có ca làm việc nào.</li>';
                    return;
                }
                shifts.forEach(shift => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    li.innerHTML = `
                        <div>
                            <div class="fw-bold">${shift.name}</div>
                            <small class="text-muted">Vào: ${shift.start_time} - Ra: ${shift.end_time} (Trễ: ${shift.late_threshold_minutes} phút)</small>
                        </div>
                        <div>
                            <button class="btn btn-warning btn-sm btn-edit">Sửa</button>
                            <button class="btn btn-danger btn-sm btn-delete">Xóa</button>
                        </div>
                    `;
                    li.querySelector('.btn-edit').addEventListener('click', () => startEdit(shift));
                    li.querySelector('.btn-delete').addEventListener('click', () => deleteShift(shift.id, shift.name));
                    shiftListUL.appendChild(li);
                });
            });
    }

    function deleteShift(id, name) {
        if (!confirm(`Bạn có chắc muốn xóa "${name}"? Thao tác này không thể hoàn tác.`)) return;
        fetchWithToken(`/api/shifts/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                if (data.error) throw new Error(data.error);
                alert(data.message);
                loadShifts();
            })
            .catch(err => alert(`Xóa thất bại: ${err.message}`));
    }

    function startEdit(shift) {
        formTitle.textContent = 'Sửa ca làm việc';
        submitBtn.textContent = 'Cập nhật';
        cancelBtn.style.display = 'inline-block';
        shiftIdInput.value = shift.id;
        shiftNameInput.value = shift.name;
        startTimeInput.value = shift.start_time;
        endTimeInput.value = shift.end_time;
        lateThresholdInput.value = shift.late_threshold_minutes;
    }

    function cancelEdit() {
        formTitle.textContent = 'Thêm ca mới';
        submitBtn.textContent = 'Lưu';
        cancelBtn.style.display = 'none';
        shiftForm.reset();
        shiftIdInput.value = '';
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        const id = shiftIdInput.value;
        const isEditing = id !== '';
        const shiftData = {
            name: shiftNameInput.value,
            start_time: startTimeInput.value,
            end_time: endTimeInput.value,
            late_threshold_minutes: lateThresholdInput.value
        };
        const url = isEditing ? `/api/shifts/${id}` : '/api/shifts';
        const method = isEditing ? 'PUT' : 'POST';

        fetchWithToken(url, {
            method: method,
            body: JSON.stringify(shiftData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            alert(data.message);
            loadShifts();
            cancelEdit();
        })
        .catch(err => alert(`Thao tác thất bại: ${err.message}`));
    }

    shiftForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', cancelEdit);

    loadShifts();
});