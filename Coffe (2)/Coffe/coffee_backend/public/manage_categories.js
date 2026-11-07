// CHỈ CHỨA CODE CHO TRANG MANAGE_CATEGORIES.HTML
document.addEventListener('DOMContentLoaded', () => {

    // LẤY CÁC PHẦN TỬ FORM DANH MỤC
    const categoryListUL = document.getElementById('category-list');
    const categoryForm = document.getElementById('category-form');
    const categoryFormTitle = document.getElementById('category-form-title');
    const categoryFormSubmitBtn = document.getElementById('category-form-submit-btn');
    const categoryFormCancelBtn = document.getElementById('category-form-cancel-btn');
    const categoryIdInput = document.getElementById('category-id');
    const categoryNameInput = document.getElementById('category-name');
    const logoutBtn = document.getElementById('logout-btn');

    // --- KHỞI CHẠY ---
    loadCategories();

    // --- HÀM TẢI DỮ LIỆU ---
    function loadCategories() {
        fetchWithToken('/api/categories')
            .then(response => response ? response.json() : null)
            .then(categories => {
                categoryListUL.innerHTML = ''; // Xóa danh sách cũ
                
                categories.forEach(category => {
                    // Cập nhật danh sách quản lý
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    li.textContent = category.name;
                    
                    const btnGroup = document.createElement('div');
                    const editBtn = document.createElement('button');
                    editBtn.className = 'btn btn-warning btn-sm me-2';
                    editBtn.textContent = 'Sửa';
                    editBtn.onclick = () => startEditCategory(category);
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-danger btn-sm';
                    deleteBtn.textContent = 'Xóa';
                    deleteBtn.onclick = () => deleteCategory(category.id);
                    
                    btnGroup.appendChild(editBtn);
                    btnGroup.appendChild(deleteBtn);
                    li.appendChild(btnGroup);
                    categoryListUL.appendChild(li);
                });
            })
            .catch(error => console.error('Lỗi khi tải danh mục:', error));
    }

    // --- CRUD 1: HÀM XỬ LÝ DANH MỤC ---
    function deleteCategory(id) {
        if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?\n(Lưu ý: Bạn chỉ xóa được nếu không có sản phẩm nào thuộc danh mục này)')) return;

        fetchWithToken(`/api/categories/${id}`, { method: 'DELETE' })
        .then(response => response ? response.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            loadCategories(); 
        })
        .catch(err => alert(`Xóa thất bại: ${err.message}`));
    }

    function startEditCategory(category) {
        categoryFormTitle.textContent = 'Sửa danh mục';
        categoryFormSubmitBtn.textContent = 'Cập nhật';
        categoryFormCancelBtn.style.display = 'inline-block'; 
        categoryIdInput.value = category.id;
        categoryNameInput.value = category.name;
    }

    function cancelEditCategory() {
        categoryFormTitle.textContent = 'Thêm danh mục mới';
        categoryFormSubmitBtn.textContent = 'Thêm';
        categoryFormCancelBtn.style.display = 'none';
        categoryForm.reset(); 
        categoryIdInput.value = ''; 
    }

    function handleCategoryFormSubmit(event) {
        event.preventDefault(); 
        const id = categoryIdInput.value;
        const isEditing = (id !== '');
        const categoryData = { name: categoryNameInput.value };

        const url = isEditing ? `/api/categories/${id}` : '/api/categories';
        const method = isEditing ? 'PUT' : 'POST';

        fetchWithToken(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
        })
        .then(response => response ? response.json() : null)
        .then(data => {
            if(data.error) throw new Error(data.error);
            alert(data.message);
            loadCategories(); 
            cancelEditCategory(); 
        })
        .catch(err => alert(`Thao tác thất bại: ${err.message}`));
    }

    // --- GẮN SỰ KIỆN ---
    categoryForm.addEventListener('submit', handleCategoryFormSubmit);
    categoryFormCancelBtn.addEventListener('click', cancelEditCategory);

    // --- LOGIC ĐĂNG XUẤT ---
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'login.html';
    });
});