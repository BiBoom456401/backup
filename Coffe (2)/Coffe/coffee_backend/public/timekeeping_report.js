document.addEventListener('DOMContentLoaded', () => {
    requireAdmin();

    const reportBody = document.getElementById('report-body');
    const filterForm = document.getElementById('report-filter-form');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const employeeSelect = document.getElementById('employee-select');
    const logoutBtn = document.getElementById('logout-btn');

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    async function populateEmployeeFilter() {
        try {
            const response = await fetchWithToken('/api/employees');
            if (!response || !response.ok) return;
            const employees = await response.json();
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id;
                option.textContent = emp.full_name;
                employeeSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Không thể tải danh sách nhân viên cho bộ lọc:", error);
        }
    }

    /**
     * Lấy địa chỉ từ tọa độ GPS sử dụng dịch vụ miễn phí Nominatim.
     * @param {number} lat Vĩ độ
     * @param {number} lon Kinh độ
     * @returns {Promise<string>} Địa chỉ hoặc thông báo lỗi.
     */
    async function getAddressFromCoordinates(lat, lon) {
        if (!lat || !lon) {
            return '---';
        }
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            if (!response.ok) return 'Không thể lấy địa chỉ';
            const data = await response.json();
            let displayName = data.display_name || 'Không tìm thấy địa chỉ';
            
            // Rút gọn địa chỉ hơn nữa, chỉ lấy 3-4 phần đầu tiên
            const addressParts = displayName.split(', ');
            if (addressParts.length > 4) {
                displayName = addressParts.slice(0, 4).join(', ');
            }
            return displayName;
        } catch (error) {
            return 'Lỗi kết nối dịch vụ địa chỉ';
        }
    }

    async function loadReport(event) {
        if (event) event.preventDefault();

        try {
            const startDate = startDateInput.value;
            const endDate = endDateInput.value;
            const employeeId = employeeSelect.value;

            let url = `/api/timekeeping/records?startDate=${startDate}&endDate=${endDate}`;
            if (employeeId) url += `&employeeId=${employeeId}`;

            const response = await fetchWithToken(url);
            if (!response || !response.ok) {
                throw new Error('Không thể tải báo cáo chấm công.');
            }
            const records = await response.json();

            reportBody.innerHTML = '';
            if (records.length === 0) {
                reportBody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có dữ liệu chấm công.</td></tr>';
                return;
            }

            // Hiển thị dữ liệu cơ bản trước, sau đó tải địa chỉ
            reportBody.innerHTML = records.map((rec, index) => {
                const checkInTime = rec.check_in_time ? new Date(rec.check_in_time).toLocaleString('vi-VN') : '---';
                const checkOutTime = rec.check_out_time ? new Date(rec.check_out_time).toLocaleString('vi-VN') : '---';
                let statusBadge = '';
                if (rec.check_in_status === 'late') {
                    statusBadge = '<span class="badge bg-danger">Đi trễ</span>';
                } else if (rec.check_in_status === 'on_time') {
                    statusBadge = '<span class="badge bg-success">Đúng giờ</span>';
                }
                
                // Thêm trạng thái ra
                const checkOutStatusBadge = `<span class="badge bg-secondary">${rec.status === 'checked_in' ? 'Đang làm việc' : 'Đã về'}</span>`;

                return `
                    <tr>
                        <td>${rec.full_name}</td>
                        <td>${checkInTime}</td>
                        <td>${checkOutTime}</td>
                        <td>${statusBadge}</td>
                        <td>${checkOutStatusBadge}</td>
                        <td id="check-in-loc-${index}"><span class="spinner-border spinner-border-sm"></span></td>
                        <td id="check-out-loc-${index}"><span class="spinner-border spinner-border-sm"></span></td>
                    </tr>
                `;
            }).join('');

            // Tải và hiển thị địa chỉ
            for (let i = 0; i < records.length; i++) {
                const rec = records[i];
                const row = document.createElement('tr');

                const [checkInAddress, checkOutAddress] = await Promise.all([
                    getAddressFromCoordinates(rec.check_in_latitude, rec.check_in_longitude),
                    getAddressFromCoordinates(rec.check_out_latitude, rec.check_out_longitude)
                ]);

                const checkInCell = document.getElementById(`check-in-loc-${i}`);
                if (checkInCell) {
                    checkInCell.innerHTML = (rec.check_in_latitude && rec.check_in_longitude)
                        ? `${checkInAddress} <br> <a href="https://www.google.com/maps?q=${rec.check_in_latitude},${rec.check_in_longitude}" target="_blank">Xem bản đồ</a>`
                        : '---';
                }
                const checkOutCell = document.getElementById(`check-out-loc-${i}`);
                if (checkOutCell) {
                    checkOutCell.innerHTML = (rec.check_out_latitude && rec.check_out_longitude)
                        ? `${checkOutAddress} <br> <a href="https://www.google.com/maps?q=${rec.check_out_latitude},${rec.check_out_longitude}" target="_blank">Xem bản đồ</a>`
                        : '---';
                }
            }
        } catch (error) {
            reportBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Lỗi: ${error.message}</td></tr>`;
        }
    }

    // Khởi tạo trang
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    endDateInput.value = today;

    populateEmployeeFilter();
    loadReport(); // Tải báo cáo cho ngày hôm nay khi mở trang
    filterForm.addEventListener('submit', loadReport);
});