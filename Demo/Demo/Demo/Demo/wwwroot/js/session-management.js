// Single Session Management
(function() {
    'use strict';

    // Kiểm tra session validity định kỳ (mỗi 30 giây)
    let sessionCheckInterval;
    let isSessionValid = true;
    let warningShown = false;
    
    function startSessionCheck() {
        // Chỉ bắt đầu kiểm tra nếu user đã đăng nhập
        if (typeof userId !== 'undefined' && userId) {
            console.log('Starting session check for user:', userId);
            sessionCheckInterval = setInterval(checkSessionValidity, 30000);
            
            // Kiểm tra ngay lập tức sau 5 giây
            setTimeout(checkSessionValidity, 5000);
        }
    }

    function stopSessionCheck() {
        if (sessionCheckInterval) {
            clearInterval(sessionCheckInterval);
            sessionCheckInterval = null;
            console.log('Session check stopped');
        }
    }

    async function checkSessionValidity() {
        try {
            const response = await fetch('/api/session/validate', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (response.status === 401) {
                // Session không hợp lệ
                isSessionValid = false;
                stopSessionCheck();
                
                if (!warningShown) {
                    warningShown = true;
                    showSessionExpiredNotification();
                }
            } else if (response.ok) {
                // Session hợp lệ
                isSessionValid = true;
                console.log('Session is valid');
            }
        } catch (error) {
            console.error('Error checking session validity:', error);
            // Trong trường hợp lỗi network, thử lại sau
            setTimeout(checkSessionValidity, 10000);
        }
    }

    function showSessionExpiredNotification() {
        // Tạo modal thông báo
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.display = 'block';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg">
                    <div class="modal-header bg-warning text-white border-0">
                        <h5 class="modal-title">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Phiên đăng nhập đã hết hạn
                        </h5>
                    </div>
                    <div class="modal-body text-center p-4">
                        <div class="mb-3">
                            <i class="fas fa-user-times fa-3x text-warning"></i>
                        </div>
                        <h6 class="mb-3">Tài khoản đang được sử dụng ở nơi khác</h6>
                        <p class="text-muted mb-4">
                            Phiên làm việc của bạn đã được chấm dứt do có đăng nhập mới từ thiết bị khác. 
                            Bạn sẽ được chuyển đến trang đăng nhập.
                        </p>
                        <div class="countdown-container mb-3">
                            <p class="mb-2">Tự động chuyển hướng sau:</p>
                            <div class="h4 text-primary">
                                <span id="countdown">5</span> giây
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0 justify-content-center">
                        <button type="button" class="btn btn-primary" onclick="redirectToLogin()">
                            <i class="fas fa-sign-in-alt me-2"></i>
                            Đăng nhập ngay
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Đếm ngược 5 giây
        let countdown = 5;
        const countdownElement = document.getElementById('countdown');
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdownElement) {
                countdownElement.textContent = countdown;
            }
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                redirectToLogin();
            }
        }, 1000);
    }    function redirectToLogin() {
        // Hiển thị loading
        const body = document.body;
        const loader = document.createElement('div');
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        loader.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted">Đang chuyển hướng...</p>
            </div>
        `;
        body.appendChild(loader);
        
        // Chuyển hướng
        setTimeout(() => {
            window.location.href = '/Session/Expired';
        }, 1000);
    }

    // Kiểm tra nếu user vừa bị logout do session conflict
    function checkUrlForSessionExpiry() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('sessionExpired') === 'true') {
            showSessionExpiredNotification();
        }
    }

    // Khởi động kiểm tra session khi trang load
    document.addEventListener('DOMContentLoaded', function() {
        checkUrlForSessionExpiry();
        
        // Delay một chút để đảm bảo session đã được khởi tạo
        setTimeout(() => {
            startSessionCheck();
        }, 2000);
    });

    // Dừng kiểm tra khi user rời trang
    window.addEventListener('beforeunload', function() {
        stopSessionCheck();
    });

    // Tạm dừng kiểm tra khi tab không active (để tiết kiệm tài nguyên)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('Tab hidden - pausing session check');
            stopSessionCheck();
        } else {
            console.log('Tab visible - resuming session check');
            if (typeof userId !== 'undefined' && userId && isSessionValid) {
                startSessionCheck();
            }
        }
    });

    // Export functions to global scope
    window.redirectToLogin = redirectToLogin;
    window.checkSessionValidity = checkSessionValidity;
    
    // Debug functions (chỉ trong development)
    if (window.location.hostname === 'localhost') {
        window.sessionDebug = {
            forceCheck: checkSessionValidity,
            showExpired: showSessionExpiredNotification,
            isValid: () => isSessionValid,
            restart: () => {
                stopSessionCheck();
                startSessionCheck();
            }
        };
    }
})();
