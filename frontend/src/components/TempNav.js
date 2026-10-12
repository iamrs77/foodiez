import React from "react";
import { Link } from "react-router-dom";

function TempNav() {
    return (
        <nav className="flex justify-between items-center w-11/12 h-16 mx-auto">
            <h1 className="text-4xl text-myGray">
                Foodiez
            </h1>
            <ul className="flex items-center">
                <li className="ml-4">
                    <Link to="/" className="btn">
                        Login
                    </Link>
                </li>
                <li className="bg-primaryCol rounded-full">
                    <Link
                        to="/register"
                        className="btn register"
                    >
                        Register
                    </Link>
                </li>
            </ul>
        </nav>
    );
}

export default TempNav;
