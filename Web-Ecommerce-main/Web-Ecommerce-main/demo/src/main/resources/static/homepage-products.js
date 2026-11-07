const PRODUCT_API = "/api/products";
const FALLBACK_PRODUCT_IMAGE = "/images/product-fallback.svg";

const promoProductGrid = document.getElementById("promoProductGrid");
const normalProductGrid = document.getElementById("normalProductGrid");

function formatPrice(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return new Intl.NumberFormat("vi-VN").format(value) + " đ";
}

function showNotification(message, type) {
  const existing = document.querySelector(".cart-notification");
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement("div");
  notification.className = `cart-notification ${type}`;
  notification.innerHTML = `
    <span>${type === "success" ? "✅" : "❌"}</span>
    <span>${message}</span>
    <a href="/cart" class="view-cart-link">Mở giỏ hàng</a>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

async function addToCart(productId) {
  try {
    const body = new URLSearchParams();
    body.set("productId", productId);
    body.set("quantity", "1");
    body.set("redirect", "/");

    const response = await fetch("/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body.toString(),
      redirect: "manual",
    });

    // 302 redirect = success (Spring returns redirect after adding)
    if (response.type === "opaqueredirect" || response.status === 302 || response.ok) {
      showNotification("Sản phẩm đã được thêm vào giỏ hàng.", "success");
    } else {
      throw new Error("Failed to add product to cart");
    }
  } catch (error) {
    showNotification("Không thể thêm sản phẩm vào giỏ lúc này.", "error");
  }
}

function buildPromoCard(product) {
  const badgeClass = product.badge ? product.badge.toLowerCase() : "";
  const badge = product.badge ? `<span class="badge ${badgeClass}">${product.badge}</span>` : "";
  const status = product.statusText || "Vừa mở bán";

  // Use effectivePrice: when promo sold out, show original price
  const displayPrice = product.promoAvailable ? product.price : product.effectivePrice;
  const showOldPrice = product.promoAvailable && product.oldPrice;
  const showDiscount = product.promoAvailable && product.discountPercent;
  const oldPrice = showOldPrice ? `<span class="card-old">${formatPrice(product.oldPrice).replace(" đ", "đ")}</span>` : "";
  const discount = showDiscount ? `<span class="card-discount">-${product.discountPercent}%</span>` : "";

  // Promo remaining info
  let promoInfo = "";
  if (product.promoQuantity && product.promoQuantity > 0) {
    if (product.promoAvailable) {
      const percent = Math.round((product.promoSold / product.promoQuantity) * 100);
      promoInfo = `
        <div class="promo-remaining">
          <div class="promo-bar">
            <div class="promo-bar-fill" style="width: ${percent}%"></div>
          </div>
          <span class="promo-text">Đã bán ${product.promoSold || 0}/${product.promoQuantity}</span>
        </div>`;
    } else {
      promoInfo = `
        <div class="promo-remaining">
          <div class="promo-bar">
            <div class="promo-bar-fill" style="width: 100%"></div>
          </div>
          <span class="promo-text promo-sold-out">Đã bán ${product.promoSold || 0}/${product.promoQuantity} — Hết KM</span>
        </div>`;
    }
  }

  const btnDisabled = false;

  return `
    <article class="promo-card" data-id="${product.id}">
      ${badge}
      <div class="card-image">
        <img src="${product.image || FALLBACK_PRODUCT_IMAGE}" alt="${product.name}">
      </div>
      <h3 class="card-name">${product.name}</h3>
      <div class="card-price">${formatPrice(displayPrice).replace(" đ", "đ")}</div>
      <div class="price-row">
        ${oldPrice}
        ${discount}
      </div>
      ${promoInfo}
      <div class="card-status">
        <span class="fire">🔥</span>
        <span>${status}</span>
      </div>
      <button class="add-to-cart-btn" onclick="window.addHomepageProductToCart(${product.id})">Thêm vào giỏ</button>
    </article>
  `;
}

function buildNormalCard(product) {
  const status = product.statusText || "Vừa mở bán";
  const oldPrice = product.oldPrice ? `<span class="card-old">${formatPrice(product.oldPrice).replace(" đ", "đ")}</span>` : "";
  const discount = product.discountPercent ? `<span class="card-discount">-${product.discountPercent}%</span>` : "";

  // Promo remaining info (same logic as promo cards)
  let promoInfo = "";
  if (product.promoQuantity && product.promoQuantity > 0) {
    if (product.promoAvailable) {
      const percent = Math.round((product.promoSold / product.promoQuantity) * 100);
      promoInfo = `
        <div class="promo-remaining">
          <div class="promo-bar">
            <div class="promo-bar-fill" style="width: ${percent}%"></div>
          </div>
          <span class="promo-text">Đã bán ${product.promoSold || 0}/${product.promoQuantity}</span>
        </div>`;
    } else {
      promoInfo = `
        <div class="promo-remaining">
          <div class="promo-bar">
            <div class="promo-bar-fill" style="width: 100%"></div>
          </div>
          <span class="promo-text promo-sold-out">Đã bán ${product.promoSold || 0}/${product.promoQuantity} — Hết KM</span>
        </div>`;
    }
  }

  return `
    <article class="normal-card" data-id="${product.id}">
      <div class="normal-body">
        <div class="normal-info">
          <h3 class="card-name">${product.name}</h3>
          <div class="card-price">${formatPrice(product.price).replace(" đ", "đ")}</div>
          <div class="price-row">
            ${oldPrice}
            ${discount}
          </div>
          ${promoInfo}
        </div>
        <div class="normal-image">
          <img src="${product.image || FALLBACK_PRODUCT_IMAGE}" alt="${product.name}">
        </div>
      </div>
      <div class="card-status">
        <span class="fire">🔥</span>
        <span>${status}</span>
      </div>
      <button class="add-to-cart-btn" onclick="window.addHomepageProductToCart(${product.id})">Thêm vào giỏ</button>
    </article>
  `;
}

async function loadProducts() {
  const response = await fetch(PRODUCT_API, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load products");
  }
  return response.json();
}

const PROMO_PAGE_SIZE = 5;
let allPromoProducts = [];
let promoCurrentPage = 0;

function renderPromoPage() {
  if (!promoProductGrid) return;
  const start = promoCurrentPage * PROMO_PAGE_SIZE;
  const pageItems = allPromoProducts.slice(start, start + PROMO_PAGE_SIZE);
  promoProductGrid.innerHTML = pageItems.map(buildPromoCard).join("");

  const prevBtn = document.getElementById("promoPrev");
  const nextBtn = document.getElementById("promoNext");
  const totalPages = Math.ceil(allPromoProducts.length / PROMO_PAGE_SIZE);
  if (prevBtn) prevBtn.disabled = promoCurrentPage <= 0;
  if (nextBtn) nextBtn.disabled = promoCurrentPage >= totalPages - 1;

  const indicator = document.getElementById("promoPageIndicator");
  if (indicator && totalPages > 1) {
    indicator.textContent = `Trang ${promoCurrentPage + 1} / ${totalPages} (${allPromoProducts.length} sản phẩm KM)`;
  } else if (indicator) {
    indicator.textContent = `${allPromoProducts.length} sản phẩm khuyến mãi`;
  }
}

(function initPromoNav() {
  const prevBtn = document.getElementById("promoPrev");
  const nextBtn = document.getElementById("promoNext");
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (promoCurrentPage > 0) {
        promoCurrentPage--;
        renderPromoPage();
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      const totalPages = Math.ceil(allPromoProducts.length / PROMO_PAGE_SIZE);
      if (promoCurrentPage < totalPages - 1) {
        promoCurrentPage++;
        renderPromoPage();
      }
    });
  }
})();

async function renderHomepageProducts() {
  if (!promoProductGrid || !normalProductGrid) {
    return;
  }

  try {
    const products = await loadProducts();
    allPromoProducts = products.filter((product) => product.promo);
    const normalProducts = products.filter((product) => !product.promo);

    if (allPromoProducts.length > 0) {
      promoCurrentPage = 0;
      renderPromoPage();
    }

    if (normalProducts.length > 0) {
      normalProductGrid.innerHTML = normalProducts.map(buildNormalCard).join("");
    }
  } catch (error) {
    console.error(error);
  }
}

window.addHomepageProductToCart = addToCart;
window.reloadHomepageProducts = renderHomepageProducts;

renderHomepageProducts();