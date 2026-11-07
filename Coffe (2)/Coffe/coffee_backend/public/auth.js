/**
 * Xử lý responsive cho sidebar trên màn hình nhỏ
 */
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const mainContent = document.querySelector('.main-content');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Tự động đóng sidebar khi click vào nội dung chính
        mainContent?.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }
});

/**
 * File này chứa các hàm xác thực và helper dùng chung cho toàn bộ ứng dụng.
 */

/**
 * Kiểm tra xem người dùng đã đăng nhập và có phải là admin không.
 * Nếu không, sẽ hiển thị cảnh báo và chuyển hướng về trang đăng nhập.
 * Hàm này nên được gọi ở đầu mỗi trang quản trị.
 */
function requireAdmin() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!token || !user || user.role !== 'admin') {
        alert('Bạn không có quyền truy cập trang này hoặc phiên làm việc đã hết hạn. Vui lòng đăng nhập lại với tài khoản admin.');
        // Xóa thông tin đăng nhập cũ để tránh lỗi
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // Chuyển hướng về trang đăng nhập
        window.location.href = 'login.html';
        return false; // Trả về false để ngăn mã tiếp theo thực thi nếu cần
    }
    return true; // Trả về true nếu xác thực thành công
}

/**
 * Gửi yêu cầu fetch với token xác thực trong header.
 * Tự động xử lý lỗi 401/403 (Unauthorized/Forbidden).
 * @param {string} url - URL của API
 * @param {object} options - Tùy chọn của hàm fetch (method, body, etc.)
 * @returns {Promise<Response|null>}
 */
async function fetchWithToken(url, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 || response.status === 403) {
        // Lỗi xác thực từ phía server, xử lý tương tự như requireAdmin
        alert('Phiên làm việc đã hết hạn hoặc bạn không có quyền. Vui lòng đăng nhập lại.');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
        return null; // Trả về null để hàm gọi biết và dừng lại
    }

    return response;
}