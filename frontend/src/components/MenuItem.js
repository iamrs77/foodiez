import React from "react";
import LocalDiningIcon from "@material-ui/icons/LocalDining";
import { connect } from "react-redux";
import { addToCart } from "../redux/actions/cartActions";

function MenuItem({ menuItems, role, addToCart }) {
    let buttonsDiv = (item) => {
        if (role === "vendor") {
            return (
                <div>
                    {/* <Link to='/'><button className="btn btn-sm btn-info edit__button"></button></Link> */}
                </div>
            );
        } else {
            return (
                <button
                    onClick={() => {
                        addItem(item);
                    }}
                    className="btn btn-sm btn-success absolute -bottom-3 left-5"
                >
                    Add to Basket
                </button>
            );
        }
    };

    let addItem = (item) => {
        addToCart(item);
    };

    let menuList = menuItems.map((item) => {
        return (
            <div
                className="item flex justify-between w-11/12 sm:w-3/5 mx-auto border-b-2 border-gray-400 pb-8 mb-10"
                key={item._id}
            >
                <div className=" flex flex-col">
                    <span className=" text-2xl font-bold uppercase">
                        {item.name}
                    </span>
                    <span className=" text-gray-500 text-lg">
                        <LocalDiningIcon />
                        &nbsp;{item.foodType}
                    </span>
                    <span
                        className=" mt-4 h-12"
                        data-toggle="tooltip"
                        data-placement="top"
                        title={item.description}
                    >
                        {item.description}
                    </span>
                    <span className=" text-gray-500 font-bold">
                        ₹ {item.cost}
                    </span>
                </div>
                <div className=" relative">
                    <img
                        className=" w-36 h-36 object-cover rounded-md"
                        src="https://static.toiimg.com/thumb/52416693.cms?imgsize=789478&width=800&height=800"
                        alt=""
                    />
                    {buttonsDiv(item)}
                </div>
            </div>
        );
    });
    return <div>{menuList}</div>;
}

const mapStateToProps = (state) => {
    return {
        role: state.user.roleName,
        items: state.cart.cartItems,
    };
};

const mapDispatchToProps = (dispatch) => {
    return {
        addToCart: (item) => dispatch(addToCart(item)),
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(MenuItem);
