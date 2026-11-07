const checkUser = (first_name) => {
    var check = /^[A-Z][a-zA-z]*(\s[A-Z][a-zA-Z]*)*$/;
    if(!check.test(first_name)){
        alert("Invalid name. Please make sure the name starts with an uppercase letter and is followed by words separated by spaces.");
        return false;
    }
    else
        return true;
}
const checkEmail = (email) => {
    let arrEmail = [];
    var email = document.getElementById("email").value;
    var checkEmail =/^[a-zA-Z0-9]+\@[a-zA-Z]{4,7}\.[a-zA-Z]{3}$/;
    if(email === arrEmail){
        alert("Email account already exists!");
        return false;
    }
    else if(!checkEmail.test(email))
    {   alert("Please re-enter the correct email address!");
        return false;}
    else{
        arrEmail.push(email);
        return true;
    }
}
const checkPassword = (password) => {
    event.preventDefault;
    const char = /^[A-Za-z0-9!@#$%^&*()_+[\]{}|;:'",.<>?/-].{8,20}$/;
    if(password.length < 8){
        alert("The password must be at least 8 characters! Please re-enter!");
        return false;
    }
    else if(!char.test(password)){
        alert("Passwords include lowercase, uppercase, numbers, and special characters!");
        return false;
    }
    else
        return true;
}
const checkconfirmPassword = (confirmPassword,password) => {
    if(confirmPassword === password){
        return true;
    }
    else   
        alert("Invalid confirmPasswork");
        return false;
}
const kiemTraDangKi = () =>{
        var first_name = document.getElementById("first-name").value;
        var email = document.getElementById("email").value;
        var password = document.getElementById("password").value;
        var confirmPassword = document.getElementById("confirm-password").value;
        checkUser(first_name);
        checkEmail(email);
        checkPassword(password);
        checkconfirmPassword(confirmPassword,password);
        if ( checkUser(first_name) && checkEmail(email) && checkPassword(password) && checkconfirmPassword(confirmPassword, password)) {
            const userData = {
                first_name: first_name,
                email: email,
                password: password
            };
            // Lưu thông tin đăng ký vào localStorage
            localStorage.setItem('userData', JSON.stringify(userData));
            window.location.href="../HTML/Trang chủ.html";
        }
        
}
const formbtn = document.getElementById("action");
formbtn.addEventListener('submit',(e) => {
    e.preventDefault();
    kiemTraDangKi();
});


