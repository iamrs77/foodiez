import React from "react";
import StarIcon from "@material-ui/icons/Star";
import LocationOnIcon from "@material-ui/icons/LocationOn";
import { Link } from "react-router-dom";

function FoodItem({ vendors }) {
    let vendorsList = vendors.map((vendor) => {
        return (
            <div
                className=" m-2 border border-gray-300 rounded-md w-full sm:w-72 h-fit hover:shadow-xl cursor-pointer"
                key={vendor._id}
            >
                <div className=" flex flex-col text-gray-600">
                    <div className=" block mx-auto my-0">
                        <img
                            className="h-48 w-64 object-contain"
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/RedDot_Burger.jpg/2560px-RedDot_Burger.jpg"
                            alt=""
                        />
                    </div>
                    <div className=" p-3">
                        <div
                            className=" uppercase font-bold text-2xl overflow-ellipsis overflow-hidden whitespace-nowrap"
                            title={vendor.name}
                        >
                            {vendor.name}
                        </div>
                        <div className=" overflow-ellipsis overflow-hidden my-2 whitespace-nowrap">
                            {vendor.foodType}
                        </div>
                        <div className=" location overflow-ellipsis overflow-hidden my-2 whitespace-nowrap text-sm text-gray-500">
                            <LocationOnIcon />
                            {vendor.location}
                        </div>
                        <div className=" flex justify-between items-center my-2 text-sm">
                            <span className="flex items-center">
                                <StarIcon />
                                {vendor.rating
                                    ? vendor.rating
                                    : "NA"}
                            </span>
                            <span>.</span>
                            <span>
                                {vendor.deliveryTime} mins
                            </span>
                            <span>.</span>
                            <span>
                                {" "}
                                ₹ {vendor.minPrice} for Two
                            </span>
                        </div>
                        <div>
                            <Link
                                to={`/menu/${vendor._id}`}
                                className="btn btn-sm btn-primary block w-full"
                            >
                                View Menu
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    });

    return (
        <div className="flex flex-wrap max-w-screen-xl mx-auto">
            {vendorsList}
        </div>
    );
}

export default FoodItem;
