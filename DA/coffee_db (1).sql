-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th12 03, 2025 lúc 06:36 PM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `coffee_db`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Cà phê'),
(4, 'Đá xay'),
(2, 'Trà sữa'),
(3, 'Trà trái cây');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `coffeetables`
--

CREATE TABLE `coffeetables` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `status` enum('trống','có khách') NOT NULL DEFAULT 'trống',
  `x_position` int(11) DEFAULT 0,
  `y_position` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `coffeetables`
--

INSERT INTO `coffeetables` (`id`, `name`, `status`, `x_position`, `y_position`) VALUES
(10, 'Bàn 1', 'trống', 0, 0),
(12, 'Bàn 2', 'trống', 0, 0),
(13, 'Bàn 3', 'trống', 0, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `employeeschedules`
--

CREATE TABLE `employeeschedules` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `shift_id` int(11) NOT NULL,
  `work_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `employeeschedules`
--

INSERT INTO `employeeschedules` (`id`, `user_id`, `shift_id`, `work_date`) VALUES
(1, 12, 2, '2025-11-30'),
(2, 13, 2, '2025-11-30'),
(4, 14, 1, '2025-11-30'),
(5, 15, 2, '2025-11-30'),
(6, 12, 1, '2025-12-01'),
(7, 13, 2, '2025-12-01'),
(8, 14, 1, '2025-12-01'),
(9, 15, 1, '2025-12-01'),
(10, 16, 1, '2025-12-01'),
(11, 12, 1, '2025-12-02'),
(12, 13, 1, '2025-12-02'),
(13, 14, 1, '2025-12-02'),
(14, 15, 2, '2025-12-02'),
(15, 16, 2, '2025-12-02'),
(16, 1, 1, '2025-12-03'),
(17, 12, 1, '2025-12-03'),
(18, 13, 2, '2025-12-03'),
(19, 14, 2, '2025-12-03'),
(20, 15, 2, '2025-12-03');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `materials`
--

CREATE TABLE `materials` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `stock_level` decimal(10,2) NOT NULL DEFAULT 0.00,
  `safety_stock` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `materials`
--

INSERT INTO `materials` (`id`, `name`, `unit`, `stock_level`, `safety_stock`) VALUES
(1, 'Cà phê', 'kg', 10618.06, 50.00);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orderdetails`
--

CREATE TABLE `orderdetails` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,0) NOT NULL,
  `size` varchar(100) DEFAULT NULL,
  `note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `orderdetails`
--

INSERT INTO `orderdetails` (`id`, `order_id`, `product_id`, `quantity`, `price`, `size`, `note`) VALUES
(1, 19, 6, 1, 25000, 'S', NULL),
(2, 19, 1, 1, 25000, 'L', NULL),
(3, 19, 8, 1, 20000, 'S', NULL),
(4, 20, 4, 1, 22000, 'M', NULL),
(5, 20, 8, 1, 20000, 'S', NULL),
(6, 21, 8, 8, 20000, 'S', NULL),
(7, 21, 7, 8, 45000, 'M', NULL),
(8, 21, 6, 6, 25000, 'S', NULL),
(9, 21, 1, 13, 20000, 'M', NULL),
(10, 21, 5, 1, 45000, 'M', NULL),
(11, 22, 8, 1, 20000, 'S', NULL),
(12, 22, 4, 1, 22000, 'M', NULL),
(13, 22, 3, 34, 20000, 'M', NULL),
(14, 22, 2, 1, 30000, 'M', NULL),
(15, 22, 6, 20, 25000, 'S', NULL),
(16, 23, 1, 1, 15000, 'S', NULL),
(17, 23, 2, 1, 30000, 'M', NULL),
(18, 23, 4, 1, 22000, 'M', NULL),
(19, 23, 6, 1, 30000, 'M', NULL),
(20, 24, 4, 1, 22000, 'M', NULL),
(21, 24, 6, 1, 25000, 'S', NULL),
(22, 24, 7, 1, 50000, 'L', NULL),
(23, 25, 1, 1, 25000, 'L', NULL),
(24, 25, 1, 1, 25000, 'L', NULL),
(25, 25, 3, 1, 20000, 'M', 'cà phơ cu giả'),
(26, 26, 5, 1, 45000, 'M', NULL),
(27, 26, 4, 1, 22000, 'M', NULL),
(28, 26, 2, 1, 30000, 'M', NULL),
(29, 26, 6, 1, 30000, 'M', NULL),
(30, 27, 6, 1, 30000, 'M', NULL),
(31, 27, 4, 1, 22000, 'M', NULL),
(32, 27, 2, 1, 30000, 'M', NULL),
(33, 27, 5, 1, 45000, 'M', NULL),
(34, 28, 4, 1, 22000, 'M', NULL),
(35, 28, 3, 1, 20000, 'M', NULL),
(36, 28, 2, 1, 30000, 'M', NULL),
(37, 28, 6, 1, 25000, 'S', NULL),
(38, 28, 5, 1, 45000, 'M', NULL),
(39, 29, 4, 1, 22000, 'M', NULL),
(40, 29, 3, 1, 20000, 'M', NULL),
(41, 29, 2, 1, 30000, 'M', NULL),
(42, 29, 6, 6, 30000, 'M', NULL),
(43, 29, 5, 13, 45000, 'M', NULL),
(44, 30, 1, 1, 25000, 'L', NULL),
(45, 30, 4, 1, 22000, 'M', NULL),
(46, 30, 2, 1, 30000, 'M', NULL),
(47, 30, 6, 1, 30000, 'M', NULL),
(48, 30, 5, 1, 45000, 'M', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `table_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `total_amount` decimal(10,0) NOT NULL DEFAULT 0,
  `status` enum('chưa thanh toán','đã thanh toán') NOT NULL DEFAULT 'chưa thanh toán',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `table_id`, `user_id`, `total_amount`, `status`, `created_at`) VALUES
(19, 10, 12, 70000, 'đã thanh toán', '2025-11-30 06:09:48'),
(20, 10, 1, 42000, 'đã thanh toán', '2025-11-30 07:01:54'),
(21, 13, 1, 975000, 'đã thanh toán', '2025-11-30 07:02:38'),
(22, 10, 1, 1252000, 'đã thanh toán', '2025-11-30 07:08:46'),
(23, 10, 14, 97000, 'đã thanh toán', '2025-11-30 07:48:08'),
(24, 10, 14, 97000, 'đã thanh toán', '2025-11-30 07:51:15'),
(25, 10, 1, 70000, 'đã thanh toán', '2025-11-30 07:54:59'),
(26, 10, 1, 127000, 'đã thanh toán', '2025-11-30 08:07:02'),
(27, 10, 1, 127000, 'đã thanh toán', '2025-11-30 09:54:32'),
(28, 10, 1, 142000, 'chưa thanh toán', '2025-12-01 15:05:02'),
(29, 12, 1, 837000, 'đã thanh toán', '2025-12-01 15:05:41'),
(30, 10, 14, 152000, 'chưa thanh toán', '2025-12-03 17:31:05');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`id`, `name`, `category_id`) VALUES
(1, 'Cà phê đen', 1),
(2, 'Bạc xỉu', 1),
(3, 'Cà phê đen', 1),
(4, 'Cà phê sữa', 1),
(5, 'Trà sữa trân châu đường đen', 2),
(6, 'Trà ôlong nho', 3),
(7, 'Choco Đá xay', 4),
(8, 'Trà xoài', 3),
(9, 'Trà sữa khoai môn', 2);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `productvariants`
--

CREATE TABLE `productvariants` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `size` varchar(100) NOT NULL,
  `price` decimal(10,0) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `productvariants`
--

INSERT INTO `productvariants` (`id`, `product_id`, `size`, `price`) VALUES
(1, 1, 'M', 20000),
(2, 2, 'M', 30000),
(3, 3, 'M', 20000),
(4, 4, 'M', 22000),
(5, 5, 'M', 45000),
(8, 1, 'S', 15000),
(9, 1, 'L', 25000),
(10, 6, 'S', 25000),
(11, 6, 'M', 30000),
(12, 7, 'S', 40000),
(13, 7, 'M', 45000),
(14, 7, 'L', 50000),
(15, 8, 'S', 20000),
(16, 9, 'S', 40000),
(17, 9, 'M', 45000),
(18, 9, 'L', 50000);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `purchaseorderdetails`
--

CREATE TABLE `purchaseorderdetails` (
  `id` int(11) NOT NULL,
  `purchase_order_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,0) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `purchaseorders`
--

CREATE TABLE `purchaseorders` (
  `id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `order_date` date NOT NULL,
  `total_cost` decimal(10,0) NOT NULL DEFAULT 0,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `recipes`
--

CREATE TABLE `recipes` (
  `id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `recipes`
--

INSERT INTO `recipes` (`id`, `variant_id`, `material_id`, `quantity`) VALUES
(1, 8, 1, 0.02),
(2, 1, 1, 0.04);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'admin', 'Quản trị viên, có toàn bộ quyền truy cập hệ thống.'),
(2, 'staff', 'Nhân viên cơ bản, có quyền bán hàng.');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `shifts`
--

CREATE TABLE `shifts` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `late_threshold_minutes` int(11) NOT NULL DEFAULT 5
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `shifts`
--

INSERT INTO `shifts` (`id`, `name`, `start_time`, `end_time`, `late_threshold_minutes`) VALUES
(1, 'Ca sáng', '07:00:00', '12:00:00', 5),
(2, 'Ca chiều', '13:00:00', '18:00:00', 5);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `phone`, `address`, `email`) VALUES
(1, 'Buôn Mê Coffee', '0918 555 302', '35/4A Ao Đôi, Bình Trị Đông A, Quận Bình Tân, Tp.HCM', 'rangxaycaphe@gmail.com');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `timekeeping`
--

CREATE TABLE `timekeeping` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `check_in_time` datetime DEFAULT NULL,
  `check_out_time` datetime DEFAULT NULL,
  `check_in_status` varchar(20) DEFAULT 'on_time',
  `check_in_latitude` decimal(10,8) DEFAULT NULL,
  `check_in_longitude` decimal(11,8) DEFAULT NULL,
  `check_out_latitude` decimal(10,8) DEFAULT NULL,
  `check_out_longitude` decimal(11,8) DEFAULT NULL,
  `status` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `timekeeping`
--

INSERT INTO `timekeeping` (`id`, `user_id`, `check_in_time`, `check_out_time`, `check_in_status`, `check_in_latitude`, `check_in_longitude`, `check_out_latitude`, `check_out_longitude`, `status`) VALUES
(1, 12, '2025-11-30 12:54:17', '2025-11-30 13:04:07', 'on_time', NULL, NULL, NULL, NULL, 'checked_out'),
(2, 12, '2025-11-30 13:05:55', '2025-11-30 13:06:47', 'on_time', NULL, NULL, NULL, NULL, 'checked_out'),
(3, 12, '2025-11-30 13:06:52', '2025-11-30 13:06:56', 'on_time', NULL, NULL, NULL, NULL, 'checked_out'),
(4, 12, '2025-11-30 13:06:59', '2025-11-30 13:07:02', 'on_time', NULL, NULL, NULL, NULL, 'checked_out'),
(5, 12, '2025-11-30 13:07:10', '2025-11-30 13:07:14', 'on_time', NULL, NULL, NULL, NULL, 'checked_out'),
(6, 12, '2025-11-30 13:07:19', '2025-11-30 13:07:23', 'on_time', NULL, NULL, NULL, NULL, 'checked_out'),
(7, 12, '2025-11-30 13:07:31', '2025-11-30 13:07:36', 'on_time', NULL, NULL, NULL, NULL, 'checked_out'),
(8, 12, '2025-11-30 13:07:41', '2025-11-30 13:07:51', 'on_time', NULL, NULL, NULL, NULL, 'checked_out'),
(9, 13, '2025-11-30 13:34:42', '2025-11-30 13:34:45', 'late', NULL, NULL, NULL, NULL, 'checked_out'),
(10, 13, '2025-11-30 13:34:51', '2025-11-30 13:37:18', 'late', NULL, NULL, NULL, NULL, 'checked_out'),
(11, 13, '2025-11-30 13:37:47', '2025-11-30 13:42:17', 'late', NULL, NULL, 10.84847490, 106.78870248, 'checked_out'),
(12, 13, '2025-11-30 13:42:20', '2025-12-04 00:25:55', 'late', 10.84847490, 106.78870248, 10.84847276, 106.78870359, 'checked_out'),
(13, 13, '2025-12-04 00:26:11', '2025-12-04 00:26:15', 'on_time', 10.84847276, 106.78870359, 10.84847276, 106.78870359, 'checked_out');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int(11) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `salary` decimal(12,2) DEFAULT 0.00,
  `position_title` varchar(255) DEFAULT NULL,
  `face_descriptor` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `role_id`, `full_name`, `date_of_birth`, `address`, `phone_number`, `salary`, `position_title`, `face_descriptor`) VALUES
(1, 'admin', '$2b$10$CWL4XDbGMDLTleCLL3l7I.NjElobzqrLmX9UGsHks0EvVASVXzPRG', 1, 'Quản Trị Viên', NULL, NULL, NULL, 0.00, NULL, NULL),
(12, 'nguyenthihaianh2865', '$2b$10$BXKoEPiMBRyzZoJCqnM9KOlW6T/310dbHwcL.LlMzlAI1PlnlOckC', 2, 'Nguyễn Thị Hải Anh', '2004-06-14', 'Phường Tân Triều, tỉnh Đồng Nai', '093344556', 5000000.00, 'Pha chế', NULL),
(13, 'tranbienminhtam1821', '$2b$10$T7mMw/jcl39k0Y.2Vq9FnOqH.NW320wQtqieP.vp2.pDiiiWdZIRC', 2, 'Trần Biện Minh Tâm', '2004-03-03', 'huyện Cần Giuộc, tỉnh Long An', '099887766', 4000000.00, 'Thu Ngân', NULL),
(14, 'vothinganthu2429', '$2b$10$Es6DWrEryf4jRHz1EPJG5.f7CevikGsI6fLBHpJy9C6ijm.hChb8S', 2, 'Võ Thị Ngân Thư', '2003-06-01', 'Phường Tân Triều, tỉnh Đồng Nai', '066554433', 7000000.00, 'Pha chế', NULL),
(15, 'nguyenthithuhuong9321', '$2b$10$9v1gcjQPc0ZNCPkaRutTOeVGoIMCKA6iJ7FPF6OMGoIIG202EsGhq', 2, 'Nguyễn Thị Thu Hương', '2007-06-26', 'Quận 9, TP.Thủ Đức', '088775566', 4000000.00, 'Thu Ngân', NULL),
(16, 'admin123', '$2b$10$/SMxmFvBechmIiO7UVa/4eqRfHfBkd4urm.E/oV.5/iHEU797i10K', 1, 'Quản trị viên', NULL, NULL, NULL, 0.00, NULL, NULL),
(17, 'qr_order_user', 'dummy_hash', 2, 'KH', NULL, NULL, NULL, 0.00, NULL, NULL);

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Chỉ mục cho bảng `coffeetables`
--
ALTER TABLE `coffeetables`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `employeeschedules`
--
ALTER TABLE `employeeschedules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_work_date` (`user_id`,`work_date`),
  ADD KEY `shift_id` (`shift_id`);

--
-- Chỉ mục cho bảng `materials`
--
ALTER TABLE `materials`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `orderdetails`
--
ALTER TABLE `orderdetails`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `table_id` (`table_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- Chỉ mục cho bảng `productvariants`
--
ALTER TABLE `productvariants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_id` (`product_id`);

--
-- Chỉ mục cho bảng `purchaseorderdetails`
--
ALTER TABLE `purchaseorderdetails`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_order_id` (`purchase_order_id`),
  ADD KEY `material_id` (`material_id`);

--
-- Chỉ mục cho bảng `purchaseorders`
--
ALTER TABLE `purchaseorders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Chỉ mục cho bảng `recipes`
--
ALTER TABLE `recipes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `variant_id` (`variant_id`,`material_id`),
  ADD KEY `material_id` (`material_id`);

--
-- Chỉ mục cho bảng `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Chỉ mục cho bảng `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `timekeeping`
--
ALTER TABLE `timekeeping`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `users_ibfk_1` (`role_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `coffeetables`
--
ALTER TABLE `coffeetables`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `employeeschedules`
--
ALTER TABLE `employeeschedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `materials`
--
ALTER TABLE `materials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `orderdetails`
--
ALTER TABLE `orderdetails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `productvariants`
--
ALTER TABLE `productvariants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT cho bảng `purchaseorderdetails`
--
ALTER TABLE `purchaseorderdetails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `purchaseorders`
--
ALTER TABLE `purchaseorders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `recipes`
--
ALTER TABLE `recipes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `timekeeping`
--
ALTER TABLE `timekeeping`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `employeeschedules`
--
ALTER TABLE `employeeschedules`
  ADD CONSTRAINT `employeeschedules_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `employeeschedules_ibfk_2` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `orderdetails`
--
ALTER TABLE `orderdetails`
  ADD CONSTRAINT `orderdetails_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `orderdetails_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Các ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `coffeetables` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Các ràng buộc cho bảng `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Các ràng buộc cho bảng `productvariants`
--
ALTER TABLE `productvariants`
  ADD CONSTRAINT `productvariants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `purchaseorderdetails`
--
ALTER TABLE `purchaseorderdetails`
  ADD CONSTRAINT `purchaseorderdetails_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchaseorders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchaseorderdetails_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`);

--
-- Các ràng buộc cho bảng `purchaseorders`
--
ALTER TABLE `purchaseorders`
  ADD CONSTRAINT `purchaseorders_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`);

--
-- Các ràng buộc cho bảng `recipes`
--
ALTER TABLE `recipes`
  ADD CONSTRAINT `recipes_ibfk_1` FOREIGN KEY (`variant_id`) REFERENCES `productvariants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recipes_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `timekeeping`
--
ALTER TABLE `timekeeping`
  ADD CONSTRAINT `timekeeping_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
