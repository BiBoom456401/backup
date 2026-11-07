const flashProducts = [
  {
    id: 1,
    name: "Nova Phone Air 12GB/256GB",
    image: "/images/product-fallback.svg",
    price: "8.990.000đ",
    oldPrice: "10.490.000đ",
    discountPercent: "-13%",
    badge: "AI",
    statusText: "Còn 9/10 suất",
  },
  {
    id: 2,
    name: "Nova Mini M4 16GB/256GB",
    image: "/images/product-fallback.svg",
    price: "13.990.000đ",
    oldPrice: "14.690.000đ",
    discountPercent: "-5%",
    badge: "Mới",
    statusText: "Vừa mở bán",
  },
  {
    id: 3,
    name: "Tai nghe Nova Pods Pro",
    image: "/images/product-fallback.svg",
    price: "3.690.000đ",
    oldPrice: "4.290.000đ",
    discountPercent: "-14%",
    badge: "Hot",
    statusText: "Còn 4/8 suất",
  },
  {
    id: 4,
    name: "Camera hành trình 4K",
    image: "/images/product-fallback.svg",
    price: "2.790.000đ",
    oldPrice: "3.490.000đ",
    discountPercent: "-20%",
    badge: "AI",
    statusText: "Còn 6/10 suất",
  },
];

const productGrid = document.getElementById("productGrid");

function toBadgeClass(badge) {
  return (badge || "").toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
}

function renderProducts(list) {
  productGrid.innerHTML = list.map((product) => `
    <article class="product-card" data-id="${product.id}">
      <span class="badge ${toBadgeClass(product.badge)}">${product.badge}</span>
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <h3 class="product-name">${product.name}</h3>
      <div class="price-row">
        <span class="price">${product.price}</span>
      </div>
      <div class="price-row">
        <span class="old-price">${product.oldPrice}</span>
        <span class="discount">${product.discountPercent}</span>
      </div>
      <div class="status-bar">
        <span class="fire">🔥</span>
        <span>${product.statusText}</span>
      </div>
    </article>
  `).join("");
}

renderProducts(flashProducts);
window.updateProducts = (nextProducts) => renderProducts(nextProducts);