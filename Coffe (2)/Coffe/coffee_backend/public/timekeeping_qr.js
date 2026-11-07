document.addEventListener('DOMContentLoaded', () => {
    // Chỉ admin mới được truy cập trang này
    if (!requireAdmin()) {
        return;
    }

    const qrcodeContainer = document.getElementById('qrcode');
    const statusDiv = document.getElementById('status');
    const countdownSpan = document.getElementById('countdown');
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    let qrcode = new QRCode(qrcodeContainer, {
        width: 300,
        height: 300,
        correctLevel: QRCode.CorrectLevel.H
    });

    let countdown;

    async function generateNewQRCode() {
        try {
            statusDiv.textContent = 'Đang tạo mã QR mới...';
            statusDiv.className = 'alert alert-info';

            const response = await fetchWithToken('/api/timekeeping/generate-qr-token', { method: 'POST' });
            if (!response || !response.ok) throw new Error('Không thể tạo mã QR.');

            const { token } = await response.json();
            qrcode.makeCode(token);
            statusDiv.textContent = 'Mã QR đã sẵn sàng. Vui lòng quét.';
            statusDiv.className = 'alert alert-success';

            let seconds = 20;
            countdownSpan.textContent = seconds;
            countdown = setInterval(() => {
                seconds--;
                countdownSpan.textContent = seconds;
                if (seconds <= 0) clearInterval(countdown);
            }, 1000);

        } catch (error) {
            statusDiv.textContent = `Lỗi: ${error.message}`;
            statusDiv.className = 'alert alert-danger';
        }
    }

    // Tạo mã QR lần đầu và sau đó cứ mỗi 20 giây
    generateNewQRCode();
    setInterval(generateNewQRCode, 20000);
});