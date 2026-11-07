/* eslint-disable react/prop-types */

import ProductDetail from "./ProductDetail";

const ProductList = (props) => {
  const { dataSP, addToCart } = props;
  return (
    <div>
      <h3 className="text-center">Danh sách các sản phẩm điện thoại</h3>
      <div className="row">
        {dataSP.length > 0 && dataSP.map((item) => {
          return (
            <div className="col-4" key={item.id}>
              <ProductDetail productItem={item} addToCart={addToCart}/>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductList;
