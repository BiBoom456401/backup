const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcryptjs'); // Bật lại bcrypt
const crypto = require('crypto'); // Thêm thư viện crypto để tạo mã ngẫu nhiên

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;
app.use(express.static('public')); 

// --- KHÓA BÍ MẬT ---
const JWT_SECRET = 'day-la-khoa-bi-mat-cua-ban';

// --- 1. MIDDLEWARE XÁC THỰC (BỘ LỌC) ---
function verifyToken(req, res, next) {
    const tokenHeader = req.headers['authorization'];
    if (!tokenHeader) {
        return res.status(403).json({ error: 'Truy cập bị từ chối. Không có Token.' });
    }
    
    const token = tokenHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ error: 'Token không đúng định dạng.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
        }
        req.user = decoded;
        next();
    });
}
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') { // SỬA: Dùng 'role' cho nhất quán
        return res.status(403).json({ error: 'Chức năng này yêu cầu quyền Admin.' });
    }
    next();
}


// --- 2. KẾT NỐI DATABASE ---
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'coffee_db',
  multipleStatements: true 
});
db.connect((err) => {
  if (err) {
    console.error('LỖI KẾT NỐI DATABASE:', err);
    return;
  }
  console.log('✅ Đã kết nối thành công đến CSDL MySQL!');
});

// --- 3. API ĐĂNG NHẬP (KHÔNG CẦN BẢO VỆ) ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) { return res.status(400).json({ error: 'Vui lòng nhập Tên đăng nhập và Mật khẩu' }); }
    const sql = `
        SELECT u.id, u.username, u.password_hash, r.name as role 
        FROM Users u 
        JOIN Roles r ON u.role_id = r.id 
        WHERE u.username = ?
    `;
    db.query(sql, [username], (err, users) => {
        if (err) return res.status(500).json({ error: 'Lỗi server CSDL' });
        if (users.length === 0) { return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' }); }
        
        const user = users[0];

        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) return res.status(500).json({ error: 'Lỗi khi xác thực mật khẩu' });
            if (!isMatch) {
                return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
            }
            const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
            res.json({ message: 'Đăng nhập thành công!', token: token, user: { id: user.id, username: user.username, role: user.role } });
        });
    });
});

// --- 4. API BÁN HÀNG (Cần đăng nhập, staff và admin đều dùng được) ---
app.get('/api/categories', verifyToken, (req, res) => {
    const sql = "SELECT * FROM Categories";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(results);
    });
});
app.get('/api/products', verifyToken, (req, res) => {
    const productSql = `
        SELECT p.id, p.name, p.category_id, c.name as category_name 
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.id
    `;
    db.query(productSql, (err, products) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        const variantsSql = "SELECT * FROM ProductVariants";
        db.query(variantsSql, (err, variants) => {
            if (err) return res.status(500).json({ error: 'Lỗi server' });
            const finalProducts = products.map(product => ({
                ...product,
                variants: variants.filter(v => v.product_id === product.id)
            }));
            res.json(finalProducts);
        });
    });
});
app.get('/api/tables', verifyToken, (req, res) => {
  const sql = "SELECT * FROM CoffeeTables";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Lỗi server' });
    res.json(results);
  });
});
app.post('/api/orders', verifyToken, (req, res) => {
    const { table_id, items, total_amount } = req.body;
    const final_user_id = req.user.id; // Lấy user_id từ token
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        const orderSql = 'INSERT INTO Orders (table_id, user_id, total_amount, status) VALUES (?, ?, ?, ?)';
        db.query(orderSql, [table_id, final_user_id, total_amount, 'chưa thanh toán'], (err, orderResult) => {
            if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi tạo order' }));
            const newOrderId = orderResult.insertId;
            const tableSql = "UPDATE CoffeeTables SET status = 'có khách' WHERE id = ?";
            db.query(tableSql, [table_id], (err, tableResult) => {
                if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi cập nhật bàn' }));
                const detailsSql = 'INSERT INTO OrderDetails (order_id, product_id, quantity, price, size, note) VALUES ?';
                const detailsValues = items.map(item => [
                    newOrderId, 
                    item.id, 
                    item.quantity, 
                    item.price,
                    item.size, 
                    item.note || null 
                ]);
                db.query(detailsSql, [detailsValues], (err, detailsResult) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi tạo chi tiết order' }));
                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi commit' }));
                        res.json({ message: 'Tạo đơn hàng thành công!', orderId: newOrderId });
                    });
                });
            });
        });
    });
});
app.get('/api/orders/table/:tableId', verifyToken, (req, res) => {
    const { tableId } = req.params;
    const orderSql = "SELECT * FROM Orders WHERE table_id = ? AND status = 'chưa thanh toán' LIMIT 1";
    db.query(orderSql, [tableId], (err, orders) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        if (orders.length === 0) return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
        const activeOrder = orders[0];
        const orderId = activeOrder.id;
        const detailsSql = `
            SELECT p.id, p.name, od.quantity, od.price, od.note, od.size 
            FROM OrderDetails od 
            JOIN Products p ON od.product_id = p.id 
            WHERE od.order_id = ?
        `;
        db.query(detailsSql, [orderId], (err, items) => {
            if (err) return res.status(500).json({ error: 'Lỗi server' });
            res.json({ orderId: orderId, totalAmount: activeOrder.total_amount, items: items });
        });
    });
});
app.put('/api/orders/pay', verifyToken, (req, res) => {
    const { orderId, tableId } = req.body;
    if (!orderId || !tableId) return res.status(400).json({ error: 'Thiếu ID' });
    const getItemsSql = `
        SELECT od.quantity, v.id as variant_id
        FROM OrderDetails od
        JOIN Products p ON od.product_id = p.id
        JOIN ProductVariants v ON p.id = v.product_id AND od.size = v.size
        WHERE od.order_id = ?
    `;
    db.query(getItemsSql, [orderId], (err, items) => {
        if (err) return res.status(500).json({ error: 'Lỗi lấy chi tiết hóa đơn' });
        const getRecipesSql = "SELECT * FROM Recipes";
        db.query(getRecipesSql, (err, allRecipes) => {
            if (err) return res.status(500).json({ error: 'Lỗi lấy định lượng' });
            let updateStockSql = '';
            items.forEach(item => {
                const recipesForVariant = allRecipes.filter(r => r.variant_id === item.variant_id);
                recipesForVariant.forEach(recipe => {
                    const quantityToSubtract = recipe.quantity * item.quantity;
                    updateStockSql += mysql.format(
                        "UPDATE Materials SET stock_level = stock_level - ? WHERE id = ?; ", 
                        [quantityToSubtract, recipe.material_id]
                    );
                });
            });
            db.beginTransaction(err => {
                if (err) return res.status(500).json({ error: 'Lỗi server (transaction)' });
                // Cập nhật trạng thái đơn hàng VÀ ghi nhận nhân viên thanh toán
                const orderSql = "UPDATE Orders SET status = 'đã thanh toán', user_id = ? WHERE id = ?";
                const tableSql = "UPDATE CoffeeTables SET status = 'trống' WHERE id = ?";
                db.query(orderSql, [req.user.id, orderId], (err, orderResult) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi cập nhật hóa đơn' }));
                    db.query(tableSql, [tableId], (err, tableResult) => {
                        if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi cập nhật bàn' }));
                        if (updateStockSql === '') {
                             db.commit(err => {
                                if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi commit' }));
                                res.json({ message: 'Thanh toán thành công (Không trừ kho)!' });
                            });
                             return;
                        }
                        db.query(updateStockSql, (err, stockResult) => {
                            if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi cập nhật tồn kho' }));
                            db.commit(err => {
                                if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi commit' }));
                                res.json({ message: 'Thanh toán và trừ kho thành công!' });
                            });
                        });
                    });
                });
            });
        });
    });
});


// --- 7. API QUẢN LÝ (Chỉ Admin: verifyToken + isAdmin) ---

// === API QUẢN LÝ USER (MỚI - ĐÃ SỬA) ===
app.post('/api/users', verifyToken, isAdmin, (req, res) => { // Sửa: nhận role_id
    const { username, password, role_id } = req.body;
    if (!username || !password || !role_id) {
        return res.status(400).json({ error: 'Vui lòng nhập đủ thông tin' });
    }

    bcrypt.genSalt(10, (err, salt) => {
        if (err) return res.status(500).json({ error: 'Lỗi tạo salt' });
        bcrypt.hash(password, salt, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Lỗi băm mật khẩu' });

            const sql = "INSERT INTO Users (username, password_hash, role_id) VALUES (?, ?, ?)";
            db.query(sql, [username, hash, role_id], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại.' });
                    return res.status(500).json({ error: 'Lỗi khi tạo người dùng.' });
                }
                res.status(201).json({ message: 'Tạo người dùng thành công!', userId: result.insertId });
            });
        });
    });
});

app.get('/api/users', verifyToken, isAdmin, (req, res) => { // Sửa: JOIN để lấy tên role
    const sql = "SELECT u.id, u.username, r.name as role FROM Users u JOIN Roles r ON u.role_id = r.id";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(results);
    });
});

app.get('/api/users/:id', verifyToken, isAdmin, (req, res) => { // Sửa: Trả về role_id
    const sql = "SELECT id, username, role_id FROM Users WHERE id = ?";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        if (results.length === 0) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        const user = results[0];
        // Chuyển định dạng ngày cho input type="date"
        if (user.date_of_birth) {
            user.date_of_birth = new Date(user.date_of_birth).toISOString().split('T')[0];
        }
        res.json(user);
    });
});

app.put('/api/users/:id', verifyToken, isAdmin, (req, res) => { // Sửa: nhận role_id
    const { id } = req.params;
    const { username, password, role_id } = req.body;

    if (password) {
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Lỗi băm mật khẩu' });
            const sql = `
                UPDATE Users SET username = ?, password_hash = ?, role_id = ? WHERE id = ?
            `;
            db.query(sql, [username, hash, role_id, id], (err, result) => {
                if (err) return res.status(500).json({ error: 'Lỗi cập nhật người dùng' });
                res.json({ message: 'Cập nhật người dùng thành công!' });
            });
        });
    } else {
        const sql = `
            UPDATE Users SET username = ?, role_id = ? WHERE id = ?
        `;
        db.query(sql, [username, role_id, id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Lỗi cập nhật người dùng' });
            res.json({ message: 'Cập nhật người dùng thành công!' });
        });
    }
});

app.delete('/api/users/:id', verifyToken, isAdmin, (req, res) => {
    const userIdToDelete = req.params.id;
    if (req.user.id == userIdToDelete) {
        return res.status(400).json({ error: 'Bạn không thể tự xóa tài khoản của mình.' });
    }
    const sql = "DELETE FROM Users WHERE id = ?";
    db.query(sql, [userIdToDelete], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server hoặc người dùng đã có hóa đơn.' });
        res.json({ message: 'Xóa người dùng thành công.' });
    });
});

// === API QUẢN LÝ NHÂN VIÊN (TÁCH BIỆT) ===

// Lấy danh sách nhân viên
app.get('/api/employees', verifyToken, isAdmin, (req, res) => {
    const sql = "SELECT id, full_name, phone_number, position_title, salary FROM Users";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi lấy danh sách nhân viên' });
        res.json(results);
    });
});

// Lấy thông tin chi tiết 1 nhân viên
app.get('/api/employees/:id', verifyToken, isAdmin, (req, res) => {
    const sql = "SELECT id, full_name, date_of_birth, address, phone_number, salary, position_title FROM Users WHERE id = ?";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        if (results.length === 0) return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
        const employee = results[0];
        if (employee.date_of_birth) {
            employee.date_of_birth = new Date(employee.date_of_birth).toISOString().split('T')[0];
        }
        res.json(employee);
    });
});

// Thêm nhân viên mới
app.post('/api/employees', verifyToken, isAdmin, (req, res) => {
    const { full_name, date_of_birth, address, phone_number, salary, position_title } = req.body;
    if (!full_name) {
        return res.status(400).json({ error: 'Vui lòng nhập Họ và Tên nhân viên.' });
    }

    // Tự động tạo username và mật khẩu mặc định để lưu vào bảng Users
    const generatedUsername = full_name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '').toLowerCase() + Math.floor(1000 + Math.random() * 9000);
    const defaultPassword = '123'; // Mật khẩu mặc định
    const defaultRoleId = 2; // Mặc định là 'staff'

    bcrypt.hash(defaultPassword, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Lỗi tạo mật khẩu mặc định' });
        const sql = `
            INSERT INTO Users (username, password_hash, role_id, full_name, date_of_birth, address, phone_number, salary, position_title) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [generatedUsername, hash, defaultRoleId, full_name, date_of_birth || null, address || null, phone_number || null, salary || 0, position_title || null];
        db.query(sql, params, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Lỗi: Tên đăng nhập tự động tạo ra bị trùng. Vui lòng thử lại.' });
                return res.status(500).json({ error: 'Lỗi khi tạo nhân viên.' });
            }
            res.status(201).json({ message: 'Tạo nhân viên thành công!', userId: result.insertId });
        });
    });
});

// Cập nhật thông tin nhân viên
app.put('/api/employees/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { full_name, date_of_birth, address, phone_number, salary, position_title } = req.body;

    const sql = `
        UPDATE Users SET 
        full_name = ?, date_of_birth = ?, address = ?, phone_number = ?, salary = ?, position_title = ?
        WHERE id = ?
    `;
    const params = [full_name, date_of_birth || null, address || null, phone_number || null, salary || 0, position_title || null, id];
    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi cập nhật nhân viên' });
        res.json({ message: 'Cập nhật nhân viên thành công!' });
    });
});

// Xóa nhân viên (KHÔNG CÓ KIỂM TRA TỰ XÓA)
app.delete('/api/employees/:id', verifyToken, isAdmin, (req, res) => {
    const sql = "DELETE FROM Users WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server hoặc nhân viên đã có hóa đơn liên kết.' });
        res.json({ message: 'Xóa nhân viên thành công.' });
    });
});

// === API CHẤM CÔNG BẰNG QR CODE ===

// API tạo token cho mã QR (chỉ admin)
// Token này sẽ chứa một giá trị bí mật và có thời hạn ngắn
app.post('/api/timekeeping/generate-qr-token', verifyToken, isAdmin, (req, res) => {
    const payload = {
        secret: 'your-super-secret-qr-code-value', // Thay đổi giá trị này trong thực tế
        timestamp: Date.now()
    };
    // Token có hiệu lực trong 30 giây
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30s' });
    res.json({ token });
});

// API xử lý khi nhân viên quét mã
app.post('/api/timekeeping/scan', verifyToken, (req, res) => {
    const { qrToken, latitude, longitude } = req.body;
    const userId = req.user.id;

    if (!qrToken) {
        return res.status(400).json({ error: 'Không có mã QR.' });
    }

    // 1. Giải mã token từ mã QR
    jwt.verify(qrToken, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Mã QR không hợp lệ hoặc đã hết hạn.' });
        }

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // 2. Tìm lịch làm việc và ca làm việc của nhân viên trong ngày hôm nay
        const findScheduleSql = `
            SELECT s.start_time, s.late_threshold_minutes
            FROM EmployeeSchedules es
            JOIN Shifts s ON es.shift_id = s.id
            WHERE es.user_id = ? AND es.work_date = ?`;

        db.query(findScheduleSql, [userId, today], (err, scheduleResults) => {
            if (err) return res.status(500).json({ error: 'Lỗi truy vấn CSDL.' });

            // 3. Kiểm tra trạng thái chấm công gần nhất của nhân viên
            const findLastRecordSql = "SELECT * FROM Timekeeping WHERE user_id = ? ORDER BY id DESC LIMIT 1";
            db.query(findLastRecordSql, [userId], (err, timekeepingResults) => {
                if (err) return res.status(500).json({ error: 'Lỗi truy vấn CSDL.' });

                const lastRecord = timekeepingResults[0];

                if (!lastRecord || lastRecord.status === 'checked_out') {
                    // 4a. Thực hiện CHECK-IN
                    if (scheduleResults.length === 0) {
                        return res.status(400).json({ error: 'Bạn không có lịch làm việc hôm nay.' });
                    }
                    const schedule = scheduleResults[0];
                    const [hours, minutes, seconds] = schedule.start_time.split(':');
                    const shiftStartTime = new Date(now);
                    shiftStartTime.setHours(hours, minutes, seconds, 0);
                    shiftStartTime.setMinutes(shiftStartTime.getMinutes() + schedule.late_threshold_minutes);

                    const checkInStatus = now > shiftStartTime ? 'late' : 'on_time';
                    const message = `Check-in thành công (${checkInStatus === 'late' ? 'Đi trễ' : 'Đúng giờ'})`;

                    const checkInSql = "INSERT INTO Timekeeping (user_id, check_in_time, status, check_in_status, check_in_latitude, check_in_longitude) VALUES (?, NOW(), 'checked_in', ?, ?, ?)";
                    db.query(checkInSql, [userId, checkInStatus, latitude, longitude], (err, result) => {
                        if (err) return res.status(500).json({ error: 'Lỗi khi check-in.' });
                        res.json({ message: message, status: 'checked_in' });
                    });
                } else {
                    // 4b. Thực hiện CHECK-OUT
                    const checkOutSql = "UPDATE Timekeeping SET check_out_time = NOW(), status = 'checked_out', check_out_latitude = ?, check_out_longitude = ? WHERE id = ?";
                    db.query(checkOutSql, [latitude, longitude, lastRecord.id], (err, result) => {
                        if (err) return res.status(500).json({ error: 'Lỗi khi check-out.' });
                        res.json({ message: 'Check-out thành công!', status: 'checked_out' });
                    });
                }
            });
        });
    });
});

// API lấy lịch sử chấm công (chỉ admin)
app.get('/api/timekeeping/records', verifyToken, isAdmin, (req, res) => {
    const { startDate, endDate, employeeId } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Vui lòng cung cấp ngày bắt đầu và kết thúc.' });
    }

    let sql = `
        SELECT t.id, u.full_name, t.check_in_time, t.check_out_time, t.status, t.check_in_status, t.check_in_latitude, t.check_in_longitude, t.check_out_latitude, t.check_out_longitude
        FROM Timekeeping t
        JOIN Users u ON t.user_id = u.id
    `;
    const params = [];
    const whereClauses = [];

    whereClauses.push("t.check_in_time BETWEEN ? AND ?");
    params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);

    if (employeeId) {
        whereClauses.push("t.user_id = ?");
        params.push(employeeId);
    }

    sql += ` WHERE ${whereClauses.join(' AND ')} ORDER BY t.check_in_time DESC`;

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi lấy lịch sử chấm công.' });
        res.json(results);
    });
});

// === API QUẢN LÝ CA LÀM VIỆC (SHIFTS) ===

// Lấy tất cả ca làm
app.get('/api/shifts', verifyToken, isAdmin, (req, res) => {
    db.query("SELECT * FROM Shifts ORDER BY start_time", (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi truy vấn CSDL.' });
        res.json(results);
    });
});

// Thêm ca làm mới
app.post('/api/shifts', verifyToken, isAdmin, (req, res) => {
    const { name, start_time, end_time, late_threshold_minutes } = req.body;
    const sql = "INSERT INTO Shifts (name, start_time, end_time, late_threshold_minutes) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, start_time, end_time, late_threshold_minutes], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi khi thêm ca làm việc.' });
        res.status(201).json({ message: 'Thêm ca làm việc thành công!', id: result.insertId });
    });
});

// Cập nhật ca làm
app.put('/api/shifts/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { name, start_time, end_time, late_threshold_minutes } = req.body;
    const sql = "UPDATE Shifts SET name = ?, start_time = ?, end_time = ?, late_threshold_minutes = ? WHERE id = ?";
    db.query(sql, [name, start_time, end_time, late_threshold_minutes, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi khi cập nhật ca làm việc.' });
        res.json({ message: 'Cập nhật thành công!' });
    });
});

// Xóa ca làm
app.delete('/api/shifts/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM Shifts WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi: Không thể xóa ca làm việc này, có thể nó đang được sử dụng trong lịch làm việc.' });
        res.json({ message: 'Xóa ca làm việc thành công!' });
    });
});

// === API QUẢN LÝ LỊCH LÀM VIỆC (SCHEDULES) ===

// Lấy lịch làm việc trong một khoảng thời gian
app.get('/api/schedules', verifyToken, isAdmin, (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Vui lòng cung cấp ngày bắt đầu và kết thúc.' });
    }
    const sql = "SELECT * FROM EmployeeSchedules WHERE work_date BETWEEN ? AND ?";
    db.query(sql, [startDate, endDate], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi truy vấn CSDL.' });
        res.json(results);
    });
});

// Tạo hoặc cập nhật lịch làm việc
app.post('/api/schedules', verifyToken, isAdmin, (req, res) => {
    const { userId, workDate, shiftId } = req.body;

    // Nếu shiftId là null hoặc rỗng, nghĩa là xóa lịch (cho nghỉ)
    if (!shiftId) {
        const deleteSql = "DELETE FROM EmployeeSchedules WHERE user_id = ? AND work_date = ?";
        db.query(deleteSql, [userId, workDate], (err, result) => {
            if (err) return res.status(500).json({ error: 'Lỗi khi xóa lịch làm việc.' });
            res.json({ message: 'Đã xóa lịch làm việc.' });
        });
        return;
    }

    // Nếu có shiftId, dùng INSERT ... ON DUPLICATE KEY UPDATE để vừa tạo mới vừa cập nhật
    const sql = `
        INSERT INTO EmployeeSchedules (user_id, work_date, shift_id) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE shift_id = ?`;
    db.query(sql, [userId, workDate, shiftId, shiftId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi khi lưu lịch làm việc.' });
        res.status(201).json({ message: 'Lưu lịch làm việc thành công!' });
    });
});

// === API QUẢN LÝ VAI TRÒ (MỚI) ===
app.get('/api/roles', verifyToken, isAdmin, (req, res) => {
    db.query("SELECT * FROM Roles", (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(results);
    });
});

app.post('/api/roles', verifyToken, isAdmin, (req, res) => {
    const { name, description } = req.body;
    const sql = "INSERT INTO Roles (name, description) VALUES (?, ?)";
    db.query(sql, [name, description], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Thêm vai trò thành công!', id: result.insertId });
    });
});

app.put('/api/roles/:id', verifyToken, isAdmin, (req, res) => {
    const { name, description } = req.body;
    const sql = "UPDATE Roles SET name = ?, description = ? WHERE id = ?";
    db.query(sql, [name, description, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Cập nhật vai trò thành công!' });
    });
});

app.delete('/api/roles/:id', verifyToken, isAdmin, (req, res) => {
    const sql = "DELETE FROM Roles WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi: Vai trò này có thể đang được sử dụng.' });
        res.json({ message: 'Xóa vai trò thành công!' });
    });
});

app.post('/api/categories', verifyToken, isAdmin, (req, res) => {
    const { name } = req.body;
    const sql = 'INSERT INTO Categories (name) VALUES (?)';
    db.query(sql, [name], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Thêm danh mục thành công!', id: result.insertId });
    });
});
app.put('/api/categories/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const sql = 'UPDATE Categories SET name = ? WHERE id = ?';
    db.query(sql, [name, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Cập nhật danh mục thành công!' });
    });
});
app.delete('/api/categories/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Categories WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server, hoặc danh mục đang được sử dụng' });
        res.json({ message: 'Xóa danh mục thành công!' });
    });
});
app.post('/api/products', verifyToken, isAdmin, (req, res) => {
    const { name, category_id } = req.body;
    const sql = 'INSERT INTO Products (name, category_id) VALUES (?, ?)';
    db.query(sql, [name, category_id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Thêm sản phẩm thành công!', id: result.insertId });
    });
});
app.put('/api/products/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { name, category_id } = req.body;
    const sql = 'UPDATE Products SET name = ?, category_id = ? WHERE id = ?';
    db.query(sql, [name, category_id, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Cập nhật sản phẩm thành công!' });
    });
});
app.delete('/api/products/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Products WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Xóa sản phẩm thành công!' });
    });
});
app.post('/api/variants', verifyToken, isAdmin, (req, res) => {
    const { product_id, size, price } = req.body;
    const sql = "INSERT INTO ProductVariants (product_id, size, price) VALUES (?, ?, ?)";
    db.query(sql, [product_id, size, price], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Thêm size thành công!', id: result.insertId });
    });
});
app.put('/api/variants/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { size, price } = req.body;
    const sql = "UPDATE ProductVariants SET size = ?, price = ? WHERE id = ?";
    db.query(sql, [size, price, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Cập nhật size thành công!' });
    });
});
app.delete('/api/variants/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM ProductVariants WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Xóa size thành công!' });
    });
});
app.post('/api/tables', verifyToken, isAdmin, (req, res) => {
    const { name } = req.body;
    const sql = "INSERT INTO CoffeeTables (name, status) VALUES (?, 'trống')";
    db.query(sql, [name], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi thêm bàn' });
        res.json({ message: 'Thêm bàn thành công!', id: result.insertId });
    });
});
app.put('/api/tables/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const sql = "UPDATE CoffeeTables SET name = ? WHERE id = ?";
    db.query(sql, [name, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Cập nhật bàn thành công!' });
    });
});
app.delete('/api/tables/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM CoffeeTables WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi: Bàn này có thể đã có hóa đơn liên kết hoặc đang được sử dụng.' });
        }
        res.json({ message: 'Xóa bàn thành công!' });
    });
});
app.get('/api/reports/sales', verifyToken, isAdmin, (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc' });
    }
    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;
    const sql = `
        SELECT o.id, o.total_amount, o.status, o.created_at, u.full_name as employee_name, ct.name as table_name
        FROM Orders o
        JOIN Users u ON o.user_id = u.id
        JOIN CoffeeTables ct ON o.table_id = ct.id
        WHERE o.status = 'đã thanh toán' 
        AND o.created_at BETWEEN ? AND ?
        ORDER BY o.created_at DESC
    `;
    db.query(sql, [startDateTime, endDateTime], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(results);
    });
});
app.get('/api/orders/:orderId', verifyToken, isAdmin, (req, res) => {
    const { orderId } = req.params;
    const mainSql = `
        SELECT o.created_at, t.name AS table_name 
        FROM Orders o
        JOIN CoffeeTables t ON o.table_id = t.id
        WHERE o.id = ?
    `;
    db.query(mainSql, [orderId], (err, mainResults) => {
        if (err) return res.status(500).json({ error: 'Lỗi server (query 1)' });
        if (mainResults.length === 0) return res.status(404).json({ error: 'Không tìm thấy hóa đơn' });
        const mainInfo = mainResults[0];
        const detailsSql = `
            SELECT p.name, od.size, od.quantity, od.price, od.note 
            FROM OrderDetails od 
            JOIN Products p ON od.product_id = p.id 
            WHERE od.order_id = ?
        `;
        db.query(detailsSql, [orderId], (err, items) => {
            if (err) return res.status(500).json({ error: 'Lỗi server (query 2)' });
            res.json({
                mainInfo: mainInfo,
                items: items
            });
        });
    });
});
app.get('/api/suppliers', verifyToken, isAdmin, (req, res) => {
    db.query("SELECT * FROM Suppliers", (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(results);
    });
});
app.post('/api/suppliers', verifyToken, isAdmin, (req, res) => {
    const { name, phone, address, email } = req.body;
    const sql = "INSERT INTO Suppliers (name, phone, address, email) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, phone, address, email], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Thêm nhà cung cấp thành công!', id: result.insertId });
    });
});
app.put('/api/suppliers/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { name, phone, address, email } = req.body;
    const sql = "UPDATE Suppliers SET name = ?, phone = ?, address = ?, email = ? WHERE id = ?";
    db.query(sql, [name, phone, address, email, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Cập nhật nhà cung cấp thành công!' });
    });
});
app.delete('/api/suppliers/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM Suppliers WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi (có thể NCC đang được dùng)' });
        res.json({ message: 'Xóa nhà cung cấp thành công!' });
    });
});
app.get('/api/materials', verifyToken, isAdmin, (req, res) => {
    db.query("SELECT * FROM Materials", (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json(results);
    });
});
app.post('/api/materials', verifyToken, isAdmin, (req, res) => {
    const { name, unit, safety_stock } = req.body;
    const sql = "INSERT INTO Materials (name, unit, safety_stock, stock_level) VALUES (?, ?, ?, 0)";
    db.query(sql, [name, unit, safety_stock], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Thêm NVL thành công!', id: result.insertId });
    });
});
app.put('/api/materials/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const { name, unit, safety_stock } = req.body;
    const sql = "UPDATE Materials SET name = ?, unit = ?, safety_stock = ? WHERE id = ?";
    db.query(sql, [name, unit, safety_stock, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' }); // Đã sửa lỗi 5D00
        res.json({ message: 'Cập nhật NVL thành công!' });
    });
});
app.delete('/api/materials/:id', verifyToken, isAdmin, (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM Materials WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi (có thể NVL đang được dùng)' });
        res.json({ message: 'Xóa NVL thành công!' });
    });
});
app.post('/api/purchase-orders', verifyToken, isAdmin, (req, res) => {
    const { supplier_id, order_date, note, items } = req.body;
    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Phiếu nhập phải có ít nhất 1 mặt hàng.' });
    }
    const total_cost = items.reduce((sum, item) => sum + (item.quantity * item.cost_price), 0);
    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: 'Lỗi server (transaction)' });
        const poSql = "INSERT INTO PurchaseOrders (supplier_id, order_date, total_cost, note) VALUES (?, ?, ?, ?)";
        db.query(poSql, [supplier_id || null, order_date, total_cost, note], (err, poResult) => {
            if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi tạo phiếu nhập' }));
            const newPoId = poResult.insertId;
            const detailsValues = items.map(item => [newPoId, item.material_id, item.quantity, item.cost_price]);
            const detailsSql = "INSERT INTO PurchaseOrderDetails (purchase_order_id, material_id, quantity, cost_price) VALUES ?";
            db.query(detailsSql, [detailsValues], (err, detailsResult) => {
                if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi tạo chi tiết phiếu nhập' }));
                let updateStockSql = '';
                items.forEach(item => {
                    updateStockSql += mysql.format("UPDATE Materials SET stock_level = stock_level + ? WHERE id = ?; ", [item.quantity, item.material_id]);
                });
                db.query(updateStockSql, (err, updateResult) => {
                    if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi cập nhật tồn kho' }));
                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ error: 'Lỗi commit' }));
                        res.json({ message: 'Nhập hàng thành công!', id: newPoId });
                    });
                });
            });
        });
    });
});
app.get('/api/purchase-orders', verifyToken, isAdmin, (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc' });
    }
    const sql = `
        SELECT po.id, po.order_date, po.total_cost, s.name AS supplier_name 
        FROM PurchaseOrders po
        LEFT JOIN Suppliers s ON po.supplier_id = s.id
        WHERE po.order_date BETWEEN ? AND ?
        ORDER BY po.order_date DESC, po.id DESC
    `;
    db.query(sql, [startDate, endDate], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' }); // Đã sửa lỗi 5D00
        res.json(results);
    });
});
app.get('/api/purchase-orders/:poId', verifyToken, isAdmin, (req, res) => {
    const { poId } = req.params;
    const mainSql = `
        SELECT po.id, po.order_date, po.note, s.name AS supplier_name
        FROM PurchaseOrders po
        LEFT JOIN Suppliers s ON po.supplier_id = s.id
        WHERE po.id = ?
    `;
    db.query(mainSql, [poId], (err, mainResults) => {
        if (err) return res.status(500).json({ error: 'Lỗi server (query 1)' }); // Đã sửa lỗi 5S00
        if (mainResults.length === 0) return res.status(404).json({ error: 'Không tìm thấy phiếu nhập' });
        const mainInfo = mainResults[0];
        const detailsSql = `
            SELECT pod.quantity, pod.cost_price, m.name AS material_name, m.unit 
            FROM PurchaseOrderDetails pod
            JOIN Materials m ON pod.material_id = m.id
            WHERE pod.purchase_order_id = ?
        `;
        db.query(detailsSql, [poId], (err, items) => {
            if (err) return res.status(500).json({ error: 'Lỗi server (query 2)' });
            res.json({
                mainInfo: mainInfo,
                items: items
            });
        });
    });
});

// === API CHO DASHBOARD MỚI (THAY THẾ API CŨ) ===

// API lấy dữ liệu thống kê nhanh cho các thẻ
app.get('/api/dashboard/quick-stats', verifyToken, isAdmin, (req, res) => {
    const queries = {
        totalOrders: "SELECT COUNT(id) as count FROM Orders WHERE status = 'đã thanh toán'",
        totalProducts: "SELECT COUNT(id) as count FROM Products",
        totalCustomers: "SELECT COUNT(id) as count FROM Users WHERE role_id != 1", // Giả sử role admin là 1
        totalEmployees: "SELECT COUNT(id) as count FROM Users WHERE role_id != 1" // Tương tự, cần định nghĩa rõ hơn
    };

    db.query(`${queries.totalOrders}; ${queries.totalProducts}; ${queries.totalCustomers}; ${queries.totalEmployees}`, (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi lấy dữ liệu thống kê nhanh.' });
        res.json({
            totalOrders: results[0][0].count,
            totalProducts: results[1][0].count,
            totalCustomers: results[2][0].count,
            totalEmployees: results[3][0].count
        });
    });
});

// API lấy doanh thu theo tháng trong năm
app.get('/api/dashboard/monthly-revenue/:year', verifyToken, isAdmin, (req, res) => {
    const { year } = req.params;
    const sql = `
        SELECT 
            MONTH(created_at) as month,
            SUM(total_amount) as revenue
        FROM Orders
        WHERE status = 'đã thanh toán' AND YEAR(created_at) = ?
        GROUP BY MONTH(created_at)
        ORDER BY month ASC
    `;
    db.query(sql, [year], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi lấy doanh thu theo tháng.' });
        res.json(results);
    });
});

// === API CHO KHÁCH HÀNG QUÉT QR (KHÔNG CẦN TOKEN) ===

// API lấy menu và thông tin bàn khi khách quét QR
app.get('/api/customer/menu/:tableId', (req, res) => {
    const { tableId } = req.params;

    // Lấy thông tin bàn và toàn bộ menu
    const tableSql = "SELECT id, name FROM CoffeeTables WHERE id = ?";
    const productSql = `
        SELECT p.id, p.name, p.category_id, c.name as category_name 
        FROM Products p
        LEFT JOIN Categories c ON p.category_id = c.id
    `;
    const variantsSql = "SELECT * FROM ProductVariants";
    const categoriesSql = "SELECT * FROM Categories";

    db.query(`${tableSql}; ${productSql}; ${variantsSql}; ${categoriesSql}`, [tableId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server khi tải menu.' });

        const [tables, products, variants, categories] = results;

        if (tables.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bàn này.' });
        }

        const finalProducts = products.map(product => ({
            ...product,
            variants: variants.filter(v => v.product_id === product.id)
        }));

        res.json({
            table: tables[0],
            products: finalProducts,
            categories: categories
        });
    });
});

// API khách hàng gửi đơn hàng
app.post('/api/customer/orders', (req, res) => {
    const { table_id, items, total_amount } = req.body;
    const qr_user_id = 14; // THAY THẾ BẰNG ID CỦA 'qr_order_user' BẠN ĐÃ TẠO

    // Logic tạo đơn hàng tương tự như của nhân viên, nhưng dùng qr_user_id
    const orderSql = 'INSERT INTO Orders (table_id, user_id, total_amount, status) VALUES (?, ?, ?, ?)';
    db.query(orderSql, [table_id, qr_user_id, total_amount, 'chưa thanh toán'], (err, orderResult) => {
        if (err) return res.status(500).json({ error: 'Lỗi tạo order' });
        const newOrderId = orderResult.insertId;
        const tableSql = "UPDATE CoffeeTables SET status = 'có khách' WHERE id = ?";
        db.query(tableSql, [table_id], (err, tableResult) => {
            if (err) return res.status(500).json({ error: 'Lỗi cập nhật bàn' });
            const detailsSql = 'INSERT INTO OrderDetails (order_id, product_id, quantity, price, size, note) VALUES ?';
            const detailsValues = items.map(item => [newOrderId, item.id, item.quantity, item.price, item.size, item.note || null]);
            db.query(detailsSql, [detailsValues], (err, detailsResult) => {
                if (err) return res.status(500).json({ error: 'Lỗi tạo chi tiết order' });
                res.status(201).json({ message: 'Gửi đơn hàng thành công!', orderId: newOrderId });
            });
        });
    });
});

// --- 9. API ĐỊNH LƯỢNG ---
app.get('/api/recipes/:variantId', verifyToken, isAdmin, (req, res) => {
    const { variantId } = req.params;
    const sql = `
        SELECT r.id, r.quantity, m.name, m.unit
        FROM Recipes r
        JOIN Materials m ON r.material_id = m.id
        WHERE r.variant_id = ?
    `;
    db.query(sql, [variantId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' }); // Đã sửa lỗi 5L00
        res.json(results);
    });
});
app.post('/api/recipes', verifyToken, isAdmin, (req, res) => {
    const { variant_id, material_id, quantity } = req.body;
    const sql = "INSERT INTO Recipes (variant_id, material_id, quantity) VALUES (?, ?, ?)";
    db.query(sql, [variant_id, material_id, quantity], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' }); // Đã sửa lỗi 5m00
        res.json({ message: 'Thêm vào công thức thành công!', id: result.insertId });
    });
});
app.delete('/api/recipes/:recipeId', verifyToken, isAdmin, (req, res) => {
    const { recipeId } = req.params;
    const sql = "DELETE FROM Recipes WHERE id = ?";
    db.query(sql, [recipeId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Lỗi server' });
        res.json({ message: 'Xóa khỏi công thức thành công!' });
    });
});

// --- 10. KHỞI ĐỘNG SERVER ---
app.listen(port, () => {
  console.log(`Server đang chạy tại địa chỉ http://localhost:${port}`);
});