import React from "react";
import { Link } from "react-router-dom";
import Home from "../Home";

function VendorHome() {
    return (
        <div>
            <Home />
            <Link to="/restaurant-form">
                <button className="btn btn-info absolute top-96 right-10">
                    {" "}
                    Add Restaurant{" "}
                </button>
            </Link>
        </div>
    );
}

export default VendorHome;
