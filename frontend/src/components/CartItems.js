import React from "react";
import LocalDiningIcon from "@material-ui/icons/LocalDining";
import { connect } from "react-redux";
import { removeFromCart } from "../redux/actions/cartActions";

function CartItems({ cartItems, deleteItem }) {
    let removeitem = (item) => {
        deleteItem(item._id);
    };

    let cartList = cartItems.map((item) => {
        if (item == null) {
            return null;
        }
        return (
            <div
                className=" flex justify-between pb-8 mb-10 border-b-2 border-gray-200"
                key={Math.random()}
            >
                <div className=" flex flex-col">
                    <span className="text-2xl font-bold uppercase">
                        {item?.name}
                    </span>
                    <span className=" text-gray-500 text-lg">
                        <LocalDiningIcon />
                        &nbsp;{item?.foodType}
                    </span>
                    <span
                        className=" mt-4 h-12"
                        data-toggle="tooltip"
                        data-placement="top"
                        title={item?.description}
                    >
                        {item?.description}
                    </span>
                    <span className=" text-gray-500 font-bold">
                        ₹ {item?.cost}
                    </span>
                </div>
                <div className=" relative h-fit">
                    <img
                        className="w-36 h-36 object-cover rounded-md"
                        src="https://static.toiimg.com/thumb/52416693.cms?imgsize=789478&width=800&height=800"
                        alt=""
                    />
                    <button
                        onClick={() => {
                            removeitem(item);
                        }}
                        className="btn btn-sm btn-danger absolute -bottom-3 left-10"
                    >
                        Remove
                    </button>
                </div>
            </div>
        );
    });
    return <div className=" md:w-1/2">{cartList}</div>;
}

const mapStateToProps = (state) => {
    return {
        cartItems: state.cart.cartItems,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        deleteItem: (id) => {
            dispatch(removeFromCart(id));
        },
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(CartItems);
