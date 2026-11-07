/* eslint-disable react/prop-types */


const Cart = (props) => {
  const { arrCart } = props;
  return (
    <div>
      <h3 className="mt-2">Giỏ hàng</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Mã SP</th>
            <th>Tên sản phẩm</th>
            <th>Hình ảnh</th>
            <th>Giá bán</th>
            <th>Số lượng</th>
            <th>Thành tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {arrCart.map((spGH) => {
            return (
              <tr key={spGH.maSP}>
                <td>{spGH.maSP}</td>
                <td>{spGH.tenSP}</td>
                <td>
                  <img src={spGH.hinhAnh} alt="..." width={50} height={50} />
                </td>
                <td>{spGH.giaBan}</td>
                <td>
                  <button
                    className="btn btn-dark mx-2"
                    onClick={() => {
                      props.updateToCart(spGH.maSP, 1);
                    }}
                  >
                    +
                  </button>
                  {spGH.soLuong}
                  <button
                    className="btn btn-dark mx-2"
                    onClick={() => {
                      props.updateToCart(spGH.maSP, -1);
                    }}
                  >
                    -
                  </button>
                </td>
                <td>{spGH.giaBan * spGH.soLuong}</td>
                <td>
                  <button
                    className="btn btn-danger"
                    onClick={() => {
                      props.deleteFromCart(spGH.maSP);
                    }}
                  >
                    Xoá
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Cart;
