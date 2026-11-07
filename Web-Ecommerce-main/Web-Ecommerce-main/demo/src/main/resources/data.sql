IF OBJECT_ID('coupons', 'U') IS NOT NULL DELETE FROM coupons;
IF OBJECT_ID('order_details', 'U') IS NOT NULL DELETE FROM order_details;
IF OBJECT_ID('orders', 'U') IS NOT NULL DELETE FROM orders;
IF OBJECT_ID('customers', 'U') IS NOT NULL DELETE FROM customers;
IF OBJECT_ID('products', 'U') IS NOT NULL DELETE FROM products;
IF OBJECT_ID('categories', 'U') IS NOT NULL DELETE FROM categories;

IF OBJECT_ID('coupons', 'U') IS NOT NULL DBCC CHECKIDENT ('coupons', RESEED, 0);
IF OBJECT_ID('categories', 'U') IS NOT NULL DBCC CHECKIDENT ('categories', RESEED, 0);
IF OBJECT_ID('products', 'U') IS NOT NULL DBCC CHECKIDENT ('products', RESEED, 0);
IF OBJECT_ID('customers', 'U') IS NOT NULL DBCC CHECKIDENT ('customers', RESEED, 0);
IF OBJECT_ID('orders', 'U') IS NOT NULL DBCC CHECKIDENT ('orders', RESEED, 0);
IF OBJECT_ID('order_details', 'U') IS NOT NULL DBCC CHECKIDENT ('order_details', RESEED, 0);

INSERT INTO categories (name, icon_url, parent_id) VALUES
(N'Điện thoại', 'https://img.icons8.com/fluency/96/smartphone-tablet.png', NULL),
(N'Laptop', 'https://img.icons8.com/fluency/96/laptop.png', NULL),
(N'Âm thanh', 'https://img.icons8.com/fluency/96/headphones.png', NULL),
(N'Gaming', 'https://img.icons8.com/fluency/96/controller.png', NULL),
(N'Phụ kiện', 'https://img.icons8.com/fluency/96/usb.png', NULL);

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, promo_quantity, promo_sold, description, image_url, category_id)
VALUES (N'iPhone 16 Pro 256GB', 28990000, 31990000, 9, 'HOT', N'Còn 4 suất', 1, 20, 16, N'Chip mới, khung titan, camera zoom ổn định cho người dùng cao cấp.', 'https://img.icons8.com/fluency/240/iphone14-pro.png', (SELECT TOP 1 id FROM categories WHERE name = N'Điện thoại'));

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, promo_quantity, promo_sold, description, image_url, category_id)
VALUES (N'Samsung Galaxy S25 Ultra', 30990000, 33990000, 8, 'AI', N'Quà tặng mở bán', 1, 15, 5, N'Màn hình lớn, bút S Pen, hệ camera nhiều tiêu cự cho công việc và sáng tạo.', 'https://img.icons8.com/fluency/240/android-os.png', (SELECT TOP 1 id FROM categories WHERE name = N'Điện thoại'));

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, description, image_url, category_id)
VALUES (N'OPPO Reno12 Pro', 12490000, 13990000, 11, 'NEW', N'Vừa mở bán', 0, N'Thiết kế nhẹ, camera selfie mạnh, phù hợp nhu cầu lifestyle và social.', 'https://img.icons8.com/fluency/240/smartphone-tablet.png', (SELECT TOP 1 id FROM categories WHERE name = N'Điện thoại'));

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, description, image_url, category_id)
VALUES (N'MacBook Air M4 13 inch', 27990000, 29990000, 6, 'NEW', N'Có hàng tại showroom', 0, N'Laptop mỏng nhẹ cho học tập, làm việc sáng tạo và pin dài.', 'https://img.icons8.com/fluency/240/macbook.png', (SELECT TOP 1 id FROM categories WHERE name = N'Laptop'));

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, promo_quantity, promo_sold, description, image_url, category_id)
VALUES (N'ASUS ROG Zephyrus G16', 45990000, 49990000, 8, 'RTX', N'Flash deal tối nay', 1, 10, 3, N'Máy gaming cao cấp, màn 2.5K và GPU mạnh cho chơi game lẫn dựng hình.', 'https://img.icons8.com/fluency/240/laptop.png', (SELECT TOP 1 id FROM categories WHERE name = N'Gaming'));

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, description, image_url, category_id)
VALUES (N'Dell XPS 14 OLED', 38990000, 41990000, 7, 'PRO', N'Đặt trước giao nhanh', 0, N'Thiết kế sang, màn OLED, hướng tới người dùng văn phòng cao cấp.', 'https://img.icons8.com/fluency/240/laptop.png', (SELECT TOP 1 id FROM categories WHERE name = N'Laptop'));

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, description, image_url, category_id)
VALUES (N'Sony WH-1000XM6', 9990000, 10990000, 9, 'HOT', N'Khử ồn chủ động', 0, N'Tai nghe over-ear cao cấp, pin lâu và chất âm giàu chi tiết.', 'https://img.icons8.com/fluency/240/headphones.png', (SELECT TOP 1 id FROM categories WHERE name = N'Âm thanh'));

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, description, image_url, category_id)
VALUES (N'Loa Marshall Emberton III', 4690000, 5290000, 11, 'TREND', N'Bán chạy tuần này', 0, N'Loa bluetooth gọn, ngoại hình cổ điển, âm sắc dày và chắc.', 'https://img.icons8.com/fluency/240/speaker.png', (SELECT TOP 1 id FROM categories WHERE name = N'Âm thanh'));

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, promo_quantity, promo_sold, description, image_url, category_id)
VALUES (N'Tay cầm Xbox Wireless', 1490000, 1790000, 17, 'SALE', N'Còn 9 suất', 1, 20, 11, N'Tay cầm kết nối đa nền tảng, cầm chắc, hỗ trợ cloud gaming.', 'https://img.icons8.com/fluency/240/xbox-controller.png', (SELECT TOP 1 id FROM categories WHERE name = N'Gaming'));

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, description, image_url, category_id)
VALUES (N'Sạc GaN 100W NovaCharge', 990000, 1290000, 23, 'BEST', N'Tặng cáp Type-C', 0, N'Sạc nhanh nhiều cổng cho laptop và điện thoại, gọn cho người di chuyển.', 'https://img.icons8.com/fluency/240/charger.png', (SELECT TOP 1 id FROM categories WHERE name = N'Phụ kiện'));

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, description, image_url, category_id)
VALUES (N'SSD Portable 1TB ThunderBox', 2890000, 3290000, 12, 'PRO', N'Giảm sâu cuối tuần', 0, N'Ổ cứng di động tốc độ cao cho editor và content creator.', 'https://img.icons8.com/fluency/240/external-hard-drive.png', (SELECT TOP 1 id FROM categories WHERE name = N'Phụ kiện'));

INSERT INTO products (name, price, old_price, discount_percent, badge, status_text, promo, promo_quantity, promo_sold, description, image_url, category_id)
VALUES (N'AirPods Pro Gen 3', 6490000, 7290000, 11, 'APPLE', N'Giao trong 2 giờ', 1, 25, 8, N'Tai nghe true wireless cho hệ sinh thái Apple, khử ồn thông minh.', 'https://img.icons8.com/fluency/240/airpods-pro.png', (SELECT TOP 1 id FROM categories WHERE name = N'Âm thanh'));
