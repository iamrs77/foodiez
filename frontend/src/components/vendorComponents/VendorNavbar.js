import React from "react";
import { Link, withRouter } from "react-router-dom";
import Cookies from "universal-cookie";

function VendorNavbar(props) {
    let handleLogout = async (e) => {
        let cookies = new Cookies();
        cookies.remove("jwt", { path: "/" });
        props.history.push("/");
    };
    return (
        <div className="nav-style">
            <Link to="/home">
                <div className="h-5 w-7 z-40 font-bold ml-4">
                    <img
                        src={require("../../images/logo.jpg")}
                        alt=""
                    />
                    Foodiez
                </div>
            </Link>
            <div className="mr-4">
                <Link to="/" onClick={handleLogout}>
                    <span className="btn hover:bg-primaryCol rounded-full">
                        Logout
                    </span>
                </Link>
            </div>
        </div>
    );
}

export default withRouter(VendorNavbar);
