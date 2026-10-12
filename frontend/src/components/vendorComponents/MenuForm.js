import axios from "../../utils/axios";
import React, { useState } from "react";
import GetHeaders from "../../utils/headers";
import { useParams, withRouter } from "react-router-dom";

function MenuForm(props) {
    let { vendorId } = useParams();
    let [name, setName] = useState(null);
    let [description, setDescrition] = useState(null);
    let [foodType, setFoodType] = useState(null);
    let [cost, setCost] = useState(null);

    let handleSubmit = (e) => {
        e.preventDefault();
        axios
            .post(
                `/api/v1/foodItem/add/${vendorId}`,
                { name, description, foodType, cost },
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
                Add a dish to your menu
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
                    <label htmlFor="description">
                        Description
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="description"
                        placeholder="Enter Description"
                        required
                        onChange={(e) => {
                            setDescrition(e.target.value);
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
                    <label htmlFor="cost">Cost</label>
                    <input
                        type="number"
                        className="form-control"
                        id="cost"
                        placeholder="Enter Cost"
                        required
                        onChange={(e) => {
                            setCost(e.target.value);
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

export default withRouter(MenuForm);
