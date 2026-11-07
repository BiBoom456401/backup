/* eslint-disable react/prop-types */

const ProductDetail = (props) => {
  const { productItem } = props;
  return (
    <div className="card">
      <img src={productItem.hinhAnh} alt="..." height={350} />
      <div className="card-body">
        <h3>{productItem.tenSP}</h3>
        <p>{productItem.giaBan.toLocaleString()}</p>
        <button
          className="btn btn-dark"
          onClick={() => {
            props.addToCart(productItem);
          }}
        >
          Thêm vào giỏ <i className="fa fa-cart-plus"> </i>
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
