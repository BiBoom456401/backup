// CODE HOÀN CHỈNH CHO TRANG LOGIN.HTML
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // Hàm xóa token (đăng xuất)
    function clearLoginState() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // 1. Nếu người dùng đang ở trang login, xóa mọi token cũ
    clearLoginState(); 


    // 2. Xử lý sự kiện Submit
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault(); 
        
        const username = usernameInput.value;
        const password = passwordInput.value;

        errorMessage.style.display = 'none'; // Ẩn lỗi cũ

        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                errorMessage.textContent = data.error;
                errorMessage.style.display = 'block';
            } else {
                // Đăng nhập thành công
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // 3. Chuyển hướng
                window.location.href = 'index.html';
            }
        })
        .catch(err => {
            console.error('Lỗi khi đăng nhập:', err);
            errorMessage.textContent = 'Lỗi kết nối. Vui lòng thử lại.';
            errorMessage.style.display = 'block';
        });
    });
});