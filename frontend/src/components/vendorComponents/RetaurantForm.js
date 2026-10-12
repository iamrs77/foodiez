import axios from "../../utils/axios";
import React, { useState } from "react";
import GetHeaders from "../../utils/headers";
import { withRouter } from "react-router-dom";

function RetaurantForm(props) {
    let [name, setName] = useState(null);
    let [location, setLocation] = useState(null);
    let [foodType, setFoodType] = useState(null);
    let [minPrice, setMinPrice] = useState(null);
    let [deliveryTime, setDeliveryTime] = useState(null);

    let handleSubmit = (e) => {
        e.preventDefault();
        axios
            .post(
                "/api/v1/vendor/create",
                {
                    name,
                    location,
                    foodType,
                    minPrice,
                    deliveryTime,
                },
                { headers: GetHeaders() }
            )
            .then((response) => {
                props.history.goBack();
            })
            .catch((err) => {
                document.getElementById(
                    "error"
                ).innerHTML = err?.response?.data?.error
                    ? err?.response?.data?.error
                    : "";
            });
    };

    return (
        <div className="form w-4/5 mx-auto">
            <h1 className="text-3xl my-5">
                {" "}
                Add a Restaurant to your menu
            </h1>
            <div id="error" className="danger-text"></div>
            <form onSubmit={handleSubmit}>
                <div className="form-group col-12">
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        placeholder="Enter Name of Item"
                        required
                        onChange={(e) => {
                            setName(e.target.value);
                        }}
                    />
                </div>

                <div className="form-group col-12">
                    <label htmlFor="location">
                        Add Location
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="location"
                        placeholder="HSR Layout, Mumbai"
                        required
                        onChange={(e) => {
                            setLocation(e.target.value);
                        }}
                    />
                </div>

                <div className="form-group col-12">
                    <label htmlFor="food-type">
                        Food Type
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="food-type"
                        placeholder="Indian, Thai, Chinese etc"
                        required
                        onChange={(e) => {
                            setFoodType(e.target.value);
                        }}
                    />
                </div>

                <div className="form-group col-3">
                    <label htmlFor="min-price">
                        Minimum Price for Two
                    </label>
                    <input
                        type="number"
                        className="form-control"
                        id="min-price"
                        placeholder="Enter Cost"
                        required
                        onChange={(e) => {
                            setMinPrice(e.target.value);
                        }}
                    />
                </div>

                <div className="form-group col-3">
                    <label htmlFor="delivery-time">
                        Delivery Time in Minutes
                    </label>
                    <input
                        type="number"
                        className="form-control"
                        id="delivery-time"
                        placeholder="Time"
                        required
                        onChange={(e) => {
                            setDeliveryTime(e.target.value);
                        }}
                    />
                </div>

                <button className="btn btn-primary col-3">
                    Submit
                </button>
            </form>
        </div>
    );
}

export default withRouter(RetaurantForm);
