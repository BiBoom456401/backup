const CATEGORY_API = "/api/categories";
const categoryNav = document.getElementById("categoryNav");

const defaultIcons = {
  "điện thoại": "bi-phone",
  laptop: "bi-laptop",
  "âm thanh": "bi-headphones",
  gaming: "bi-controller",
  "phụ kiện": "bi-usb-plug",
};

function getIconForCategory(category) {
  const name = category?.name?.toLowerCase() || "";
  for (const [key, icon] of Object.entries(defaultIcons)) {
    if (name.includes(key)) {
      return icon;
    }
  }
  return "bi-grid";
}

function buildCategoryItem(category) {
  const isAccessory = category.name?.toLowerCase().includes("phụ kiện");
  const dataNav = isAccessory ? ' data-nav="phu-kien"' : "";
  const hasDropdown = isAccessory;
  const dropdownArrow = hasDropdown ? '<span class="dropdown-arrow">›</span>' : "";
  return `
    <li class="nav-item${hasDropdown ? " has-dropdown" : ""}"${dataNav}>
      <a href="/products/category/${category.id}" style="display:flex;align-items:center;gap:8px;color:inherit;text-decoration:none;">
        <i class="bi ${getIconForCategory(category)}"></i>
        <span>${category.name}</span>
        ${dropdownArrow}
      </a>
    </li>
  `;
}

async function loadCategories() {
  const response = await fetch(CATEGORY_API, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load categories");
  }
  return response.json();
}

async function renderCategoryNav() {
  if (!categoryNav) {
    return;
  }

  try {
    const categories = await loadCategories();
    const parents = categories.filter((category) => !category.parentId);
    categoryNav.innerHTML = parents.map(buildCategoryItem).join("");
    if (window.initMegaMenu) {
      window.initMegaMenu();
    }
  } catch (error) {
    console.error(error);
  }
}

window.reloadCategoryNav = renderCategoryNav;

renderCategoryNav();