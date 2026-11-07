const kiemTraDangNhap = () =>{
    var loginEmail =  document.getElementById("emailLogin").value;
    var loginPassword = document.getElementById("passwordLogin").value;
    const checkLogin = localStorage.getItem("userData");
    if(checkLogin) 
    {
        const userData = JSON.parse(checkLogin);
        if(userData.email === loginEmail && userData.password === loginPassword){
            alert("Đăng nhập thành công");
            window.location.href="../HTML/Home_Login.html";
        }
        else{
            alert("Lỗi Email hoặc mật khẩu !");
        }    
    }
    else
        alert("Bạn chưa phải là thành viên");
}
const formLogin = document.getElementById("formLogin");
formLogin.addEventListener('submit',(e) => {
    e.preventDefault();
    kiemTraDangNhap();
});