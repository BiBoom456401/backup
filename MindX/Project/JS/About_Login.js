var usernameElement = document.getElementById("user--login");
    if (usernameElement) {
        var userData = JSON.parse(localStorage.getItem("userData"));
        usernameElement.textContent = userData.first_name; // Replace "New Username" with your desired username.
    }
document.getElementById("logout-link").addEventListener("click", function(event) {
    event.preventDefault();
    localStorage.removeItem("userData");
    var c = confirm("Bạn có chắc muốn đăng xuất không");
    if(c == true){
        window.location.href = "..HTML/DangNhap.html"; 
        alert("Đăng xuất thành công");
    } 
    else
        return false;
    
});
