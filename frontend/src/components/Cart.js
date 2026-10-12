import React from "react";
import { connect } from "react-redux";
import Bill from "./Bill";
import CartItems from "./CartItems";
import { Link } from "react-router-dom";

function Cart({ cartItems }) {
    return cartItems.length > 0 ? (
        <div className=" flex justify-between flex-col-reverse md:flex-row mt-10 w-10/12 mx-auto">
            <CartItems />
            <Bill />
        </div>
    ) : (
        <div className=" mt-10">
            <Link
                to="/orderHistory"
                className="hover:no-underline"
            >
                <button className="mx-auto block text-white btn btn-info">
                    Your Order History
                </button>
            </Link>
            <h4 className="text-center mt-8 text-xl">
                OOps.. Your cart is empty
            </h4>
        </div>
    );
}

let mapStateToProps = (state) => {
    return {
        cartItems: state.cart.cartItems,
    };
};

export default connect(mapStateToProps)(Cart);
