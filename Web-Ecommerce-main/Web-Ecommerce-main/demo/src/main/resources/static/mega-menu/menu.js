const MENU_URL = "/api/categories";
const MENU_FALLBACK_URL = "/mega-menu/menuData.json";
const HOVER_DELAY = 120;

let megaMenu = document.getElementById("megaMenu");
let megaWrapper = document.getElementById("megaWrapper");
let navItem = null;
let openTimer = null;
let closeTimer = null;
let hoverBound = false;

function buildItem(item) {
  const icon = item.iconUrl
    ? `<img src="${item.iconUrl}" alt="${item.label}">`
    : `<i class="bi bi-grid"></i>`;
  return `
    <a class="mega-item" href="/products/category/${item.id}">
      ${icon}
      <span>${item.label}</span>
    </a>
  `;
}

function buildGroup(group) {
  return `
    <section class="mega-group">
      <h4>${group.title}</h4>
      <div class="mega-item-list">
        ${group.items.map(buildItem).join("")}
      </div>
    </section>
  `;
}

function buildGroupsFromCategories(categories) {
  const parent = categories.find((category) => category.name?.toLowerCase().includes("phụ kiện"));
  const children = parent ? categories.filter((category) => category.parentId === parent.id) : categories;
  const items = (children.length > 0 ? children : categories)
    .filter((category) => !parent || category.id !== parent.id)
    .map((category) => ({
      id: category.id,
      label: category.name,
      iconUrl: category.iconUrl,
    }));

  const midpoint = Math.ceil(items.length / 2);
  return [
    { title: "Phụ kiện nổi bật", items: items.slice(0, midpoint) },
    { title: "Thiết bị mở rộng", items: items.slice(midpoint) },
  ].filter((group) => group.items.length > 0);
}

function buildGroupsFromFallback(data) {
  const nav = data?.navItems?.find((item) => item.id === "phu-kien");
  return nav?.groups || [];
}

async function loadMenu() {
  const response = await fetch(MENU_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load category menu");
  }
  return response.json();
}

function renderMenu(data) {
  if (!megaMenu) {
    return;
  }

  const groups = Array.isArray(data)
    ? buildGroupsFromCategories(data)
    : buildGroupsFromFallback(data);
  megaMenu.innerHTML = `<div class="mega-grid">${groups.map(buildGroup).join("")}</div>`;
}

function openMenu() {
  clearTimeout(closeTimer);
  openTimer = setTimeout(() => {
    if (megaMenu) {
      megaMenu.classList.add("is-open");
      megaMenu.setAttribute("aria-hidden", "false");
    }
    if (navItem) {
      navItem.classList.add("is-open");
    }
  }, HOVER_DELAY);
}

function closeMenu() {
  clearTimeout(openTimer);
  closeTimer = setTimeout(() => {
    if (megaMenu) {
      megaMenu.classList.remove("is-open");
      megaMenu.setAttribute("aria-hidden", "true");
    }
    if (navItem) {
      navItem.classList.remove("is-open");
    }
  }, HOVER_DELAY);
}

function attachHover() {
  if (!navItem || !megaMenu || !megaWrapper || hoverBound) {
    return;
  }

  navItem.addEventListener("mouseenter", openMenu);
  navItem.addEventListener("mouseleave", closeMenu);
  megaWrapper.addEventListener("mouseenter", openMenu);
  megaWrapper.addEventListener("mouseleave", closeMenu);
  hoverBound = true;
}

async function reloadMenu() {
  try {
    const categories = await loadMenu();
    renderMenu(categories);
  } catch (error) {
    try {
      const fallback = await fetch(MENU_FALLBACK_URL, { cache: "no-store" }).then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load fallback menu data");
        }
        return response.json();
      });
      renderMenu(fallback);
    } catch (fallbackError) {
      console.error(fallbackError);
      if (megaMenu) {
        megaMenu.innerHTML = "";
      }
    }
  }
}

function initMegaMenu() {
  megaMenu = document.getElementById("megaMenu");
  megaWrapper = document.getElementById("megaWrapper");
  navItem = document.querySelector('[data-nav="phu-kien"]');
  reloadMenu();
  attachHover();
}

window.initMegaMenu = initMegaMenu;
window.reloadMenu = reloadMenu;

initMegaMenu();