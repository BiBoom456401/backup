document.addEventListener('DOMContentLoaded', () => {
    requireAdmin();

    // --- Lấy các phần tử ---
    const reportForm = document.getElementById('report-form');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const tableBody = document.getElementById('report-table-body');
    const totalRevenueSpan = document.getElementById('total-revenue');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Lấy các phần tử Modal ---
    const detailsModal = new bootstrap.Modal(document.getElementById('details-modal'));
    const modalTitle = document.getElementById('details-modal-title');
    const modalBody = document.getElementById('details-modal-body');

    // --- KHỞI TẠO ---
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    endDateInput.value = today;
    reportForm.dispatchEvent(new Event('submit')); // Tự động tải báo cáo cho ngày hôm nay

    // --- GẮN SỰ KIỆN ---
    reportForm.addEventListener('submit', (event) => {
        event.preventDefault();
        loadSalesReport();
    });

    tableBody.addEventListener('click', (event) => {
        const row = event.target.closest('.report-row');
        if (row) {
            loadOrderDetails(row.dataset.orderId);
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });

    // --- CÁC HÀM XỬ LÝ ---

    async function loadSalesReport() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!startDate || !endDate) {
            alert('Vui lòng chọn cả ngày bắt đầu và kết thúc.');
            return;
        }

        try {
            const response = await fetchWithToken(`/api/reports/sales?startDate=${startDate}&endDate=${endDate}`);
            if (!response || !response.ok) throw new Error('Không thể tải báo cáo.');
            const orders = await response.json();
            renderReport(orders);
        } catch (err) {
            console.error('Lỗi khi lấy báo cáo:', err);
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi: ${err.message}</td></tr>`;
        }
    }

    function renderReport(orders) {
        tableBody.innerHTML = '';
        let total = 0;

        if (orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Không tìm thấy hóa đơn nào.</td></tr>';
            totalRevenueSpan.textContent = '0 VNĐ';
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.className = 'report-row';
            row.style.cursor = 'pointer';
            row.dataset.orderId = order.id;

            const orderDate = new Date(order.created_at).toLocaleString('vi-VN');
            const orderTotal = Number(order.total_amount).toLocaleString('vi-VN');

            row.innerHTML = `
                <td>HD-${order.id}</td>
                <td>${orderDate}</td>
                <td>${order.table_name}</td>
                <td>${order.employee_name}</td>
                <td>${orderTotal} VNĐ</td>
            `;

            tableBody.appendChild(row);
            total += parseFloat(order.total_amount);
        });

        totalRevenueSpan.textContent = `${total.toLocaleString('vi-VN')} VNĐ`;
    }

    async function loadOrderDetails(orderId) {
        modalTitle.textContent = `Chi tiết Hóa đơn #HD-${orderId}`;
        modalBody.innerHTML = '<p>Đang tải chi tiết...</p>';
        detailsModal.show();

        try {
            const response = await fetchWithToken(`/api/orders/${orderId}`);
            if (!response || !response.ok) throw new Error('Không thể tải chi tiết hóa đơn.');
            const data = await response.json();

            let html = `<p><strong>Bàn:</strong> ${data.mainInfo.table_name}</p>
                        <p><strong>Thời gian:</strong> ${new Date(data.mainInfo.created_at).toLocaleString('vi-VN')}</p><hr>
                        <h5>Các món đã gọi:</h5>
                        <ul class="list-group">`;
            data.items.forEach(item => {
                html += `<li class="list-group-item">${item.name} (${item.size}) - SL: ${item.quantity} - Giá: ${Number(item.price).toLocaleString('vi-VN')}đ</li>`;
            });
            html += '</ul>';
            modalBody.innerHTML = html;
        } catch (err) {
            console.error('Lỗi tải chi tiết HĐ:', err);
            modalBody.innerHTML = `<p class="text-danger">Lỗi: ${err.message}</p>`;
        }
    }
});