document.addEventListener('DOMContentLoaded', () => {
    requireAdmin();

    // --- Lấy các phần tử ---
    const welcomeUserName = document.getElementById('welcome-user-name');
    const userAvatar = document.getElementById('user-avatar');
    const userFullName = document.getElementById('user-fullname');

    const statTotalOrders = document.getElementById('stat-total-orders');
    const statTotalProducts = document.getElementById('stat-total-products');
    const statTotalCustomers = document.getElementById('stat-total-customers');
    const statTotalEmployees = document.getElementById('stat-total-employees');

    const revenueChartYear = document.getElementById('revenue-chart-year');
    const logoutBtn = document.getElementById('logout-btn');

    // --- Biến cho biểu đồ ---
    let monthlyRevenueChart, categorySalesChart, totalRevenueTrendChart;

    // --- KHỞI TẠO ---
    function initialize() {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            const name = user.username || 'Admin';
            welcomeUserName.textContent = name;
            userFullName.textContent = name;
            userAvatar.textContent = name.charAt(0).toUpperCase();
        }

        loadQuickStats();
        loadAllCharts(new Date().getFullYear());

        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    async function loadQuickStats() {
        try {
            const response = await fetchWithToken('/api/dashboard/quick-stats');
            if (!response || !response.ok) throw new Error('Lỗi tải thống kê nhanh');
            const data = await response.json();
            statTotalOrders.textContent = data.totalOrders || 0;
            statTotalProducts.textContent = data.totalProducts || 0;
            statTotalCustomers.textContent = data.totalCustomers || 0;
            statTotalEmployees.textContent = data.totalEmployees || 0;

            // Cập nhật tổng doanh thu
            const statTotalRevenue = document.getElementById('stat-total-revenue'); // Lấy phần tử ngay tại đây
            if (statTotalRevenue && typeof data.totalRevenue !== 'undefined') {
                const formattedRevenue = Number(data.totalRevenue).toLocaleString('vi-VN');
                statTotalRevenue.textContent = `${formattedRevenue} đ`;
            }
        } catch (error) {
            console.error(error);
        }
    }

    function loadAllCharts(year) {
        loadMonthlyRevenueChart(year);
        loadCategorySalesChart(year);
        // Hàm load biểu đồ xu hướng tổng doanh thu có thể được thêm ở đây
    }

    async function loadMonthlyRevenueChart(year) {
        try {
            revenueChartYear.textContent = year;
            const response = await fetchWithToken(`/api/dashboard/monthly-revenue/${year}`);
            if (!response || !response.ok) throw new Error('Lỗi tải doanh thu tháng');
            const data = await response.json();

            const labels = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);
            const revenues = Array(12).fill(0);
            data.forEach(item => {
                revenues[item.month - 1] = item.revenue;
            });

            const ctx = document.getElementById('monthly-revenue-chart').getContext('2d');
            if (monthlyRevenueChart) monthlyRevenueChart.destroy();
            monthlyRevenueChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Doanh thu',
                        data: revenues,
                        backgroundColor: 'rgba(0, 123, 255, 0.6)',
                        borderColor: 'rgba(0, 123, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString('vi-VN') + ' đ';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    async function loadCategorySalesChart(year) {
        try {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            const response = await fetchWithToken(`/api/dashboard/category-sales?startDate=${startDate}&endDate=${endDate}`);
            if (!response || !response.ok) throw new Error('Lỗi tải doanh thu danh mục');
            const data = await response.json();

            const labels = data.map(d => d.categoryName);
            const sales = data.map(d => d.totalSales);

            const ctx = document.getElementById('category-sales-chart').getContext('2d');
            if (categorySalesChart) categorySalesChart.destroy();
            categorySalesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: sales,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)',
                            'rgba(153, 102, 255, 0.7)'
                        ],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        } catch (error) {
            console.error(error);
        }
    }

    initialize();
});