// hash_password.js
const bcrypt = require('bcryptjs');

const newPassword = 'admin123'; // <-- CHỌN MẬT KHẨU MỚI CỦA BẠN Ở ĐÂY
const saltRounds = 10;

bcrypt.hash(newPassword, saltRounds, (err, hash) => {
    if (err) {
        console.error("Lỗi khi tạo hash:", err);
        return;
    }
    console.log("Mật khẩu mới: ", newPassword);
    console.log("Chuỗi hash mới của bạn là:");
    console.log(hash);
    console.log("\n>>> Hãy copy chuỗi hash ở trên và dán vào cơ sở dữ liệu cho tài khoản admin.");
});