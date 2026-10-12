import axios from "../utils/axios";
import React, { useEffect, useState } from "react";
import GetHeaders from "../utils/headers";
import Moment from "react-moment";
import "moment-timezone";

function OrderHistory() {
    let [orders, setOrders] = useState([]);

    useEffect(() => {
        let isMounted = true;
        if (isMounted) {
            axios
                .get("/api/v1/cart/getOrderHistory", {
                    headers: GetHeaders(),
                })
                .then((resp) => {
                    setOrders(resp.data);
                });
        }
        return () => {
            isMounted = false;
        };
    }, []);

    let ordersList = orders.map((order) => {
        if (order.foodItem == null) {
            return null;
        }
        return (
            <div
                className="order mb-3 border-b border-gray-300 p-4 w-4/5 mx-auto flex flex-col sm:flex-row justify-between"
                key={order._id}
            >
                <div>
                    <span className=" text-xl font-bold">
                        {order?.foodItem?.name}
                    </span>
                    <br />
                    <span>₹ {order?.foodItem?.cost}</span>
                </div>

                <div>
                    ordered at:{" "}
                    <Moment format="ddd DD-MMM-YYYY">
                        {order?.createdAt}
                    </Moment>{" "}
                    -{" "}
                    <Moment
                        tz="Asia/Kolkata"
                        format="HH:MM"
                    >
                        {order?.createdAt}
                    </Moment>{" "}
                    IST
                </div>
            </div>
        );
    });

    return ordersList.length > 0 ? (
        <div>
            <h5 className=" text-center mt-4 text-2xl">
                Your last 10 Orders
            </h5>
            <div>{ordersList}</div>
        </div>
    ) : (
        <div>Loading</div>
    );
}

export default OrderHistory;
