// CODE HOÀN CHỈNH CHO TRANG MANAGE_PRODUCTS.HTML
document.addEventListener('DOMContentLoaded', () => {

    // --- Biến toàn cục ---
    let currentProductId = null; 
    let currentVariantId = null; // MỚI: Lưu ID của size đang chọn
    let allProducts = []; 
    let allCategories = []; 
    let allMaterials = []; // MỚI: Lưu NVL
    let currentFilter = { 
        categoryId: 'all',
        searchTerm: ''
    };

    // --- Lấy phần tử Cột 1 (Products) ---
    const productForm = document.getElementById('product-form');
    const formSubmitBtn = document.getElementById('form-submit-btn');
    const formCancelBtn = document.getElementById('form-cancel-btn');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('product-name');
    const productCategorySelect = document.getElementById('product-category-select');
    const productListUL = document.getElementById('product-list-manage');
    const searchInput = document.getElementById('search-product-input');
    const categoryTabs = document.getElementById('category-tabs-manage');

    // --- Lấy phần tử Cột 2 (Variants/Sizes) ---
    const variantsPanel = document.getElementById('variants-panel');
    const selectedProductName = document.getElementById('selected-product-name');
    const variantForm = document.getElementById('variant-form');
    const variantIdInput = document.getElementById('variant-id');
    const variantSizeInput = document.getElementById('variant-size');
    const variantPriceInput = document.getElementById('variant-price');
    const variantSubmitBtn = document.getElementById('variant-form-submit-btn');
    const variantCancelBtn = document.getElementById('variant-form-cancel-btn');
    const variantListUL = document.getElementById('variant-list');

    // --- Lấy phần tử Cột 3 (Recipes) (MỚI) ---
    const recipePanel = document.getElementById('recipe-panel');
    const selectedVariantName = document.getElementById('selected-variant-name');
    const recipeForm = document.getElementById('recipe-form');
    const recipeMaterialSelect = document.getElementById('recipe-material');
    const recipeQuantityInput = document.getElementById('recipe-quantity');
    const recipeListUL = document.getElementById('recipe-list');
    const logoutBtn = document.getElementById('logout-btn');


    // --- KHỞI CHẠY ---
    // Tải song song 3 loại data
    Promise.all([
        fetchWithToken('/api/categories').then(res => res ? res.json() : null),
        fetchWithToken('/api/products').then(res => res ? res.json() : null),
        fetchWithToken('/api/materials').then(res => res ? res.json() : null) // Tải NVL
    ])
    .then(([categories, products, materials]) => {
        allCategories = categories;
        allProducts = products;
        allMaterials = materials; // Lưu NVL
        
        // Đổ categories vào dropdown (trong form)
        productCategorySelect.innerHTML = '<option value="">-- Chọn loại --</option>'; 
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            productCategorySelect.appendChild(option);
        });

        // Đổ NVL vào dropdown (Cột 3)
        recipeMaterialSelect.innerHTML = '<option value="">-- Chọn NVL --</option>';
        materials.forEach(material => {
            const option = document.createElement('option');
            option.value = material.id;
            option.textContent = `${material.name} (${material.unit})`;
            recipeMaterialSelect.appendChild(option);
        });

        renderTabs();
        renderProductList();
    })
    .catch(error => console.error('Lỗi khi tải dữ liệu ban đầu:', error));
    
    // --- HÀM TẢI DỮ LIỆU & VẼ GIAO DIỆN ---
    function refreshProducts() {
        return fetchWithToken('/api/products')
            .then(res => res ? res.json() : null)
            .then(products => {
                allProducts = products; 
                renderProductList(); 
            });
    }

    function renderTabs() {
        categoryTabs.innerHTML = '';
        const allTab = document.createElement('li');
        allTab.className = 'nav-item';
        allTab.innerHTML = `<button class="nav-link active" data-id="all">Tất cả</button>`;
        allTab.querySelector('button').addEventListener('click', () => setFilter('categoryId', 'all'));
        categoryTabs.appendChild(allTab);
        allCategories.forEach(category => {
            const catTab = document.createElement('li');
            catTab.className = 'nav-item';
            catTab.innerHTML = `<button class="nav-link" data-id="${category.id}">${category.name}</button>`;
            catTab.querySelector('button').addEventListener('click', () => setFilter('categoryId', category.id));
            categoryTabs.appendChild(catTab);
        });
    }

    function renderProductList() {
        productListUL.innerHTML = '';
        let filteredProducts = allProducts;
        if (currentFilter.categoryId !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category_id === currentFilter.categoryId);
        }
        if (currentFilter.searchTerm) {
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(currentFilter.searchTerm)
            );
        }
        categoryTabs.querySelectorAll('.nav-link').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.id == currentFilter.categoryId);
        });
        if (filteredProducts.length === 0) {
            productListUL.innerHTML = '<li class="list-group-item">Không tìm thấy sản phẩm.</li>';
            return;
        }
        filteredProducts.forEach(product => {
            const li = document.createElement('li');
            li.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            const info = document.createElement('span');
            info.textContent = `${product.name} (${product.category_name || 'Chưa phân loại'})`;
            li.appendChild(info);
            const btnGroup = document.createElement('div');
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-warning btn-sm me-2';
            editBtn.textContent = 'Sửa Tên';
            editBtn.onclick = (e) => { e.stopPropagation(); startEditProduct(product); };
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.textContent = 'Xóa Món';
            deleteBtn.onclick = (e) => { e.stopPropagation(); deleteProduct(product); };
            btnGroup.appendChild(editBtn);
            btnGroup.appendChild(deleteBtn);
            li.appendChild(btnGroup);
            li.addEventListener('click', () => { selectProduct(product); });
            if(product.id === currentProductId) { li.classList.add('active'); }
            productListUL.appendChild(li);
        });
    }

    function setFilter(key, value) {
        currentFilter[key] = value;
        renderProductList();
    }
    
    // --- HÀM XỬ LÝ CỘT 1 (PRODUCTS) ---
    function deleteProduct(product) {
        if (!confirm(`Bạn có chắc chắn muốn xóa "${product.name}"?\n(Toàn bộ size và giá của món này cũng sẽ bị xóa vĩnh viễn)`)) return;
        fetchWithToken(`/api/products/${product.id}`, { method: 'DELETE' })
        .then(response => response ? response.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            refreshProducts(); 
            variantsPanel.style.display = 'none'; 
            recipePanel.style.display = 'none'; // Tắt luôn cột 3
            currentProductId = null;
        })
        .catch(err => alert(`Xóa thất bại: ${err.message}`));
    }
    function startEditProduct(product) {
        formSubmitBtn.textContent = 'Cập nhật Tên';
        formCancelBtn.style.display = 'inline-block'; 
        productIdInput.value = product.id;
        productNameInput.value = product.name;
        productCategorySelect.value = product.category_id;
        selectProduct(product);
    }
    function cancelEditProduct() {
        formSubmitBtn.textContent = 'Thêm món mới';
        formCancelBtn.style.display = 'none';
        productForm.reset(); 
        productIdInput.value = ''; 
    }
    function handleProductFormSubmit(event) {
        event.preventDefault(); 
        const id = productIdInput.value;
        const isEditing = (id !== ''); 
        const productData = {
            name: productNameInput.value,
            category_id: productCategorySelect.value
        };
        const url = isEditing ? `/api/products/${id}` : '/api/products';
        const method = isEditing ? 'PUT' : 'POST';
        fetchWithToken(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        })
        .then(response => response ? response.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            cancelEditProduct(); 
            if (!isEditing) { currentProductId = data.id; }
            refreshProducts().then(() => {
                const newProduct = allProducts.find(p => p.id === currentProductId);
                if (newProduct) { selectProduct(newProduct); }
            });
        })
        .catch(err => alert(`Thao tác thất bại: ${err.message}`));
    }

    // --- HÀM XỬ LÝ CỘT 2 (VARIANTS/SIZES) ---
    function selectProduct(product) {
        currentProductId = product.id; 
        renderProductList(); // Tải lại để tô sáng
        
        variantsPanel.style.display = 'block';
        recipePanel.style.display = 'none'; // Ẩn Cột 3
        currentVariantId = null; // Reset
        
        selectedProductName.textContent = product.name;
        cancelEditVariant();
        
        const updatedProduct = allProducts.find(p => p.id === product.id);
        
        variantListUL.innerHTML = '';
        if (!updatedProduct || updatedProduct.variants.length === 0) {
            variantListUL.innerHTML = '<li class="list-group-item">Chưa có size/giá. Hãy thêm ở trên.</li>';
            return;
        }
        
        updatedProduct.variants.forEach(variant => {
            const li = document.createElement('li');
            li.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
            li.textContent = `Size: ${variant.size} - Giá: ${variant.price}đ`;
            
            const btnGroup = document.createElement('div');
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-warning btn-sm me-2';
            editBtn.textContent = 'Sửa';
            editBtn.onclick = (e) => { e.stopPropagation(); startEditVariant(variant); };
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-danger btn-sm';
            deleteBtn.textContent = 'Xóa';
            deleteBtn.onclick = (e) => { e.stopPropagation(); deleteVariant(variant.id); };
            btnGroup.appendChild(editBtn);
            btnGroup.appendChild(deleteBtn);
            li.appendChild(btnGroup);
            
            // Click vào size để mở Cột 3
            li.addEventListener('click', () => {
                selectVariant(variant);
            });
            
            variantListUL.appendChild(li);
        });
    }
    function deleteVariant(variantId) {
        if (!confirm('Bạn có chắc chắn muốn xóa size này? (Công thức của size này cũng sẽ bị xóa)')) return;
        fetchWithToken(`/api/variants/${variantId}`, { method: 'DELETE' })
        .then(response => response ? response.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            recipePanel.style.display = 'none'; // Ẩn cột 3
            refreshProducts().then(() => {
                const currentProduct = allProducts.find(p => p.id === currentProductId);
                if (currentProduct) selectProduct(currentProduct);
            });
        })
        .catch(err => alert(`Xóa thất bại: ${err.message}`));
    }
    function startEditVariant(variant) {
        variantSubmitBtn.textContent = 'Cập nhật';
        variantCancelBtn.style.display = 'inline-block';
        variantIdInput.value = variant.id;
        variantSizeInput.value = variant.size;
        variantPriceInput.value = variant.price;
    }
    function cancelEditVariant() {
        variantSubmitBtn.textContent = 'Thêm';
        variantCancelBtn.style.display = 'none';
        variantForm.reset();
        variantIdInput.value = '';
    }
    function handleVariantFormSubmit(event) {
        event.preventDefault();
        if (!currentProductId) {
            alert('Vui lòng chọn một sản phẩm ở Cột 1 trước.');
            return;
        }
        const id = variantIdInput.value;
        const isEditing = (id !== '');
        const variantData = {
            product_id: currentProductId,
            size: variantSizeInput.value,
            price: variantPriceInput.value
        };
        const url = isEditing ? `/api/variants/${id}` : '/api/variants';
        const method = isEditing ? 'PUT' : 'POST';
        fetchWithToken(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(variantData)
        })
        .then(response => response ? response.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            cancelEditVariant(); 
            refreshProducts().then(() => {
                const currentProduct = allProducts.find(p => p.id === currentProductId);
                if (currentProduct) selectProduct(currentProduct);
            });
        })
        .catch(err => alert(`Thao tác thất bại: ${err.message}`));
    }
    
    // --- HÀM XỬ LÝ CỘT 3 (RECIPES) (MỚI) ---
    
    // Khi click 1 size ở Cột 2
    function selectVariant(variant) {
        currentVariantId = variant.id; // Lưu size đang chọn
        recipePanel.style.display = 'block'; // Hiển thị Cột 3
        selectedVariantName.textContent = `${selectedProductName.textContent} (Size ${variant.size})`;
        recipeForm.reset();
        
        // Tô sáng size đang chọn
        variantListUL.querySelectorAll('.list-group-item-action').forEach(li => {
            li.classList.remove('active');
        });
        // (Chúng ta cần tìm li tương ứng)
        
        loadRecipes(variant.id);
    }

    // Tải công thức
    function loadRecipes(variantId) {
        recipeListUL.innerHTML = '<li class="list-group-item">Đang tải...</li>';
        fetchWithToken(`/api/recipes/${variantId}`)
            .then(res => res ? res.json() : null)
            .then(recipes => {
                recipeListUL.innerHTML = '';
                if (recipes.length === 0) {
                    recipeListUL.innerHTML = '<li class="list-group-item">Chưa có định lượng.</li>';
                }
                recipes.forEach(recipe => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    li.textContent = `${recipe.name}: ${recipe.quantity} (${recipe.unit})`;
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-danger btn-sm';
                    deleteBtn.textContent = 'Xóa';
                    deleteBtn.onclick = () => deleteRecipe(recipe.id);
                    
                    li.appendChild(deleteBtn);
                    recipeListUL.appendChild(li);
                });
            })
            .catch(err => console.error("Lỗi tải công thức:", err));
    }

    // Xóa 1 NVL khỏi công thức
    function deleteRecipe(recipeId) {
        if (!confirm('Xóa NVL này khỏi công thức?')) return;
        fetchWithToken(`/api/recipes/${recipeId}`, { method: 'DELETE' })
        .then(res => res ? res.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            loadRecipes(currentVariantId); // Tải lại Cột 3
        })
        .catch(err => alert(`Xóa thất bại: ${err.message}`));
    }
    
    // Thêm 1 NVL vào công thức
    function handleRecipeFormSubmit(event) {
        event.preventDefault();
        if (!currentVariantId) {
            alert('Vui lòng chọn 1 size ở Cột 2.');
            return;
        }
        
        const recipeData = {
            variant_id: currentVariantId,
            material_id: recipeMaterialSelect.value,
            quantity: recipeQuantityInput.value
        };

        fetchWithToken('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recipeData)
        })
        .then(res => res ? res.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            loadRecipes(currentVariantId); // Tải lại Cột 3
            recipeForm.reset();
        })
        .catch(err => alert(`Thêm thất bại: ${err.message}`));
    }
    
    // --- GẮN SỰ KIỆN ---
    productForm.addEventListener('submit', handleProductFormSubmit);
    formCancelBtn.addEventListener('click', cancelEditProduct);
    variantForm.addEventListener('submit', handleVariantFormSubmit);
    variantCancelBtn.addEventListener('click', cancelEditVariant);
    recipeForm.addEventListener('submit', handleRecipeFormSubmit); // (MỚI)
    
    searchInput.addEventListener('input', () => {
        setFilter('searchTerm', searchInput.value.toLowerCase());
    });

    // --- LOGIC ĐĂNG XUẤT ---
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });
});