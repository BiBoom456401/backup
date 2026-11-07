const a = parseInt(prompt('Nhap a = ')) ;
const b = parseInt(prompt('Nhap b = ')) ;
const c = parseInt(prompt('Nhap c = ')) ;
let x1, x2;

const dt = b*b - 4*a*c;
if (dt < 0 ) {
    console.log('Phuong trinh vo nghiem');
} else if (dt = 0){
    x1 = x2 = -b/(2*a);
    console.log('Phuong trinh co nghiem kep',x1);
}  
else  {
    x1 = (-b + Math.sqrt(dt))/(2*a);
    x2 = (-b - Math.sqrt(dt))/(2*a);
    console.log('x1: ${x1} x2: ${x2}');
}