var addtocartButtons = document.getElementsByClassName("addtocart");

for (var i = 0; i < addtocartButtons.length; i++) {
    addtocartButtons[i].addEventListener("click", function(event) {
        event.preventDefault();
        alert("Bạn cần đăng nhập để mua hàng");
    });
}