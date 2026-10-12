import axios from "../utils/axios";
import React from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import GetHeaders from "../utils/headers";

function Bill({ cartItems, history }) {
    let itemTotal = 0;
    let taxes = 0;

    cartItems.forEach((element) => {
        itemTotal += element.cost;
    });

    let handleSubmit = (e) => {
        e.preventDefault();
        axios
            .patch(
                "/api/v1/cart/placeOrder",
                {},
                { headers: GetHeaders() }
            )
            .then((resp) => {
                history.push("/home");
            })
            .catch((err) => {
                console.log(err);
            });
    };

    return (
        <div className=" bg-white flex flex-col flex-0.8 border border-gray-100 h-fit p-6 shadow-md sticky top-20 mb-7">
            <div className=" text-myGray font-bold">
                Bill Details
            </div>
            <div className=" item-row">
                <div>Item Total</div>
                <div>₹ {itemTotal}</div>
            </div>
            <div className=" text-gray-500 text-base item-row">
                <div>Taxes and charges</div>
                <div>₹ {taxes}</div>
            </div>
            <div className=" border-t border-gray-400 item-row">
                <div>Total</div>
                <div>₹ {itemTotal + taxes}</div>
            </div>
            <form>
                <button
                    type="submit"
                    onClick={handleSubmit}
                    className="btn btn-success w-full mt-4"
                >
                    Place Order
                </button>
            </form>
            <Link to="/orderHistory">
                <button className="btn btn-info w-full mt-4">
                    Your Order History
                </button>
            </Link>
        </div>
    );
}

let mapStateToProps = (state) => {
    return {
        cartItems: state.cart.cartItems,
    };
};

export default connect(mapStateToProps)(withRouter(Bill));
