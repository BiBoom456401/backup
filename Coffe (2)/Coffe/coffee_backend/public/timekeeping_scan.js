document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!token || !user) {
        window.location.href = 'login.html';
        return;
    }

    // Thêm kiểm tra HTTPS
    if (window.isSecureContext === false) {
        document.getElementById('reader').style.display = 'none';
        document.getElementById('scan-result').style.display = 'none';
        document.querySelector('.lead').style.display = 'none';
        document.getElementById('secure-context-error').style.display = 'block';
        console.error('Camera access is only available in a secure context (HTTPS).');
        return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    const resultModalEl = document.getElementById('resultModal');
    const resultModal = new bootstrap.Modal(resultModalEl);
    const resultModalContent = document.getElementById('result-modal-content');
    const resultIcon = document.getElementById('result-icon');
    const resultMessage = document.getElementById('result-message');

    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    let isProcessing = false;

    function showResultPopup(message, isSuccess) {
        resultMessage.textContent = message;
        if (isSuccess) {
            resultModalContent.className = 'modal-content text-center border-0 shadow-lg success';
            resultIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                </svg>`;
        } else {
            resultModalContent.className = 'modal-content text-center border-0 shadow-lg error';
            resultIcon.innerHTML = `
                <svg xmlns="http://www.w0.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-circle-fill" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                </svg>`;
        }
        resultModal.show();
        // Tự động đóng pop-up sau 3 giây
        setTimeout(() => resultModal.hide(), 3000);
    }

    function onScanSuccess(decodedText, decodedResult) {
        if (isProcessing) return;
        isProcessing = true;

        // 1. Yêu cầu vị trí
        showResultPopup('Đã quét được mã! Đang lấy vị trí của bạn...', true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // 2. Gửi yêu cầu chấm công KÈM THEO VỊ TRÍ
                const { latitude, longitude } = position.coords;
                fetchWithToken('/api/timekeeping/scan', {
                    method: 'POST',
                    body: JSON.stringify({ qrToken: decodedText, latitude, longitude })
                })
                .then(response => {
                    if (!response) return; // Lỗi đã được xử lý trong fetchWithToken
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    showResultPopup(data.message, true);
                })
                .catch(error => {
                    showResultPopup(error.message, false);
                })
                .finally(() => {
                    // Cho phép quét lại sau 3.5 giây để pop-up kịp đóng
                    setTimeout(() => { isProcessing = false; }, 3500);
                });
            },
            (error) => {
                // Xử lý lỗi không lấy được vị trí
                console.error("Lỗi định vị:", error);
                showResultPopup('Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí.', false);
                setTimeout(() => { isProcessing = false; }, 3500);
            }
        );
    }

    let html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render(onScanSuccess);
});