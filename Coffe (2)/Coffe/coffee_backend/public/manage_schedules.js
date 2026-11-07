document.addEventListener('DOMContentLoaded', async () => {
    requireAdmin();
    
    // Kích hoạt plugin cho dayjs
    dayjs.extend(window.dayjs_plugin_isoWeek);
    
    const weekDisplay = document.getElementById('week-display');
    const scheduleHead = document.getElementById('schedule-head');
    const scheduleBody = document.getElementById('schedule-body');
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    let currentDay = dayjs(); // Sử dụng dayjs thay cho new Date()
    let employees = [];
    let shifts = [];
    
    logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });
    
    async function initialize() {
        try {
            const [emps, shfts] = await Promise.all([
                fetchWithToken('/api/employees').then(res => res.json()),
                fetchWithToken('/api/shifts').then(res => res.json())
            ]);
            employees = emps || [];
            shifts = shfts || [];
            renderWeek();
        } catch (error) {
            console.error("Initialization failed:", error);
            alert('Không thể tải dữ liệu nhân viên và ca làm.');
        }
    }
    
    async function renderWeek() {
        const startOfWeek = currentDay.startOf('isoWeek');
        const endOfWeek = currentDay.endOf('isoWeek');
        
        weekDisplay.textContent = `Tuần từ ${startOfWeek.format('DD/MM/YYYY')} đến ${endOfWeek.format('DD/MM/YYYY')}`;
        
        // Fetch schedules for this week
        const startDateStr = startOfWeek.format('YYYY-MM-DD');
        const endDateStr = endOfWeek.format('YYYY-MM-DD');
        const schedulesRes = await fetchWithToken(`/api/schedules?startDate=${startDateStr}&endDate=${endDateStr}`);
        if (!schedulesRes) return;
        const schedules = await schedulesRes.json();
        const scheduleMap = new Map(schedules.map(s => [`${s.user_id}-${dayjs(s.work_date).format('YYYY-MM-DD')}`, s.shift_id]));
        
        // Render Header
        let headHTML = '<tr><th>Nhân viên</th>';
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const dayInWeek = startOfWeek.add(i, 'day');
            weekDates.push(dayInWeek);
            headHTML += `<th>${dayInWeek.format('ddd, DD/MM')}</th>`;
        }
        headHTML += '</tr>';
        scheduleHead.innerHTML = headHTML;
        
        // Render Body
        let bodyHTML = '';
        employees.forEach(emp => {
            bodyHTML += `<tr><td>${emp.full_name}</td>`;
            weekDates.forEach(date => {
                const dateStr = date.format('YYYY-MM-DD');
                const scheduleKey = `${emp.id}-${dateStr}`;
                const assignedShiftId = scheduleMap.get(scheduleKey);
                
                let optionsHTML = '<option value="">-- Nghỉ --</option>';
                shifts.forEach(shift => {
                    const isSelected = shift.id === assignedShiftId ? 'selected' : '';
                    optionsHTML += `<option value="${shift.id}" ${isSelected}>${shift.name}</option>`;
                });
                
                bodyHTML += `
                    <td>
                        <select class="form-select form-select-sm shift-select" data-user-id="${emp.id}" data-work-date="${dateStr}">
                            ${optionsHTML}
                        </select>
                    </td>`;
            });
            bodyHTML += '</tr>';
        });
        scheduleBody.innerHTML = bodyHTML;
    }
    
    async function handleShiftChange(event) {
        const select = event.target;
        if (!select.matches('.shift-select')) return;
        
        const userId = select.dataset.userId;
        const workDate = select.dataset.workDate;
        const shiftId = select.value;
        
        try {
            const response = await fetchWithToken('/api/schedules', {
                method: 'POST',
                body: JSON.stringify({ userId, workDate, shiftId: shiftId || null })
            });
            if (!response || !response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Lỗi không xác định.' }));
                throw new Error(errorData.error);
            }
            // Không cần làm gì khi thành công, thay đổi đã được lưu
        } catch (error) {
            alert(`Lưu thất bại: ${error.message}`);
            renderWeek(); // Re-render to revert the change on failure
        }
    }
    
    prevWeekBtn.addEventListener('click', () => {
        currentDay = currentDay.subtract(1, 'week');
        renderWeek();
    });
    
    nextWeekBtn.addEventListener('click', () => {
        currentDay = currentDay.add(1, 'week');
        renderWeek();
    });
    
    scheduleBody.addEventListener('change', handleShiftChange);
    
    initialize();
});