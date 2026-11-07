// CODE HOÀN CHỈNH CHO TRANG MANAGE_IMPORTS_HISTORY.HTML
document.addEventListener('DOMContentLoaded', () => {

    // Lấy các phần tử
    const historyForm = document.getElementById('history-form');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const historyList = document.getElementById('import-history-list');
    const logoutBtn = document.getElementById('logout-btn');

    // Lấy các phần tử Modal
    const detailsModal = new bootstrap.Modal(document.getElementById('import-details-modal'));
    const detailsModalTitle = document.getElementById('import-details-title');
    const detailsModalBody = document.getElementById('import-details-body');

    // Tự động điền ngày hôm nay
    const today = new Date().toISOString().split('T')[0];
    startDateInput.value = today;
    endDateInput.value = today;

    // Gắn sự kiện cho form
    historyForm.addEventListener('submit', (event) => {
        event.preventDefault(); 
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!startDate || !endDate) {
            alert('Vui lòng chọn cả ngày bắt đầu và kết thúc.');
            return;
        }

        // Gọi API
        fetchWithToken(`/api/purchase-orders?startDate=${startDate}&endDate=${endDate}`)
            .then(response => response ? response.json() : null)
            .then(data => {
                if (data.error) throw new Error(data.error);
                renderHistoryList(data); // Vẽ lại bảng
            })
            .catch(err => {
                console.error('Lỗi khi lấy lịch sử:', err);
                historyList.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Lỗi: ${err.message}</td></tr>`;
            });
    });

    // Hàm vẽ bảng
    function renderHistoryList(pos) {
        historyList.innerHTML = '';
        if (pos.length === 0) {
            historyList.innerHTML = '<tr><td colspan="4" class="text-center">Không tìm thấy phiếu nhập nào.</td></tr>';
            return;
        }
        
        pos.forEach(po => {
            const row = document.createElement('tr');
            row.className = 'po-row'; // Để click
            row.dataset.poId = po.id;
            
            const orderDate = new Date(po.order_date).toLocaleDateString('vi-VN');
            const totalCost = Number(po.total_cost).toLocaleString('vi-VN');
            
            row.innerHTML = `
                <td>PN-${po.id}</td>
                <td>${orderDate}</td>
                <td>${po.supplier_name || 'Không NCC'}</td>
                <td>${totalCost} VNĐ</td>
            `;
            historyList.appendChild(row);
        });
    }

    // HÀM TẢI CHI TIẾT
    function loadPurchaseOrderDetails(poId) {
        detailsModalTitle.textContent = `Chi tiết Phiếu Nhập #PN-${poId}`;
        detailsModalBody.innerHTML = '<p>Đang tải chi tiết...</p>';
        detailsModal.show();

        fetchWithToken(`/api/purchase-orders/${poId}`)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || `Lỗi HTTP: ${response.status}`); });
                }
                return response ? response.json() : null;
            })
            .then(data => { 
                if (data.error) throw new Error(data.error);
                if (!data.mainInfo || !data.items) {
                    throw new Error('Dữ liệu chi tiết không hợp lệ');
                }

                const orderDate = new Date(data.mainInfo.order_date).toLocaleDateString('vi-VN');
                let html = `
                    <p><strong>Nhà cung cấp:</strong> ${data.mainInfo.supplier_name || 'Không có'}</p>
                    <p><strong>Ngày nhập:</strong> ${orderDate}</p>
                    <p><strong>Ghi chú:</strong> ${data.mainInfo.note || 'Không có'}</p>
                    <hr>
                    <h5>Các mặt hàng đã nhập:</h5>
                `;

                html += '<table class="table"><thead><tr><th>NVL</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>';
                
                let totalCost = 0;
                data.items.forEach(item => {
                    const subtotal = item.quantity * item.cost_price;
                    totalCost += subtotal;
                    html += `
                        <tr>
                            <td>${item.material_name} (${item.unit})</td>
                            <td>${item.quantity}</td>
                            <td>${Number(item.cost_price).toLocaleString('vi-VN')}</td>
                            <td>${subtotal.toLocaleString('vi-VN')}</td>
                        </tr>
                    `;
                });
                
                html += '</tbody></table>';
                html += `<h4 class="text-end">Tổng cộng: ${totalCost.toLocaleString('vi-VN')} VNĐ</h4>`;
                
                detailsModalBody.innerHTML = html;
            })
            .catch(err => {
                console.error('Lỗi tải chi tiết PN:', err);
                detailsModalBody.innerHTML = `<p class="text-danger">Lỗi: ${err.message}</p>`;
            });
    }

    // Gắn sự kiện click cho Lịch sử
    historyList.addEventListener('click', (event) => {
        const row = event.target.closest('.po-row');
        if (row) {
            loadPurchaseOrderDetails(row.dataset.poId);
        }
    });

    // Tự động chạy khi tải trang
    historyForm.requestSubmit();

    // --- LOGIC ĐĂNG XUẤT ---
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });
});