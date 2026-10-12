import React from "react";
import ShoppingBasketIcon from "@material-ui/icons/ShoppingBasket";
import { Link, withRouter } from "react-router-dom";
import Cookies from "universal-cookie";
import { connect } from "react-redux";
import { Badge } from "@material-ui/core";

function Navbar(props) {
    let handleLogout = async (e) => {
        let cookies = new Cookies();
        cookies.remove("jwt", { path: "/" });
        props.history.push("/login");
    };

    return (
        <div className="nav-style">
            <Link to="/home">
                <div className="h-5 w-7 z-40 font-bold ml-4">
                    <img
                        src={require("../images/logo.jpg")}
                        alt=""
                    />
                    Foodiez
                </div>
            </Link>

            <div className=" flex items-center justify-evenly mr-4">
                <Link to="/home">
                    <span className="btn hover:bg-primaryCol rounded-full">
                        Home
                    </span>
                </Link>
                <Link
                    to="/"
                    onClick={handleLogout}
                    className=" hover:bg-primaryCol rounded-full"
                >
                    <span className="btn">Logout</span>
                </Link>
                <Link to="/cart">
                    <div className=" ml-2 text-black">
                        <Badge
                            badgeContent={
                                props?.items?.length
                            }
                            max={99}
                            color="primary"
                        >
                            <ShoppingBasketIcon />
                        </Badge>
                    </div>
                </Link>
            </div>
        </div>
    );
}

const mapStateToProps = (state) => {
    return {
        items: state.cart.cartItems,
    };
};

export default connect(mapStateToProps)(withRouter(Navbar));
