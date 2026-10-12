import axios from "../utils/axios";
import React, { useState } from "react";
import TempNav from "./TempNav";
import { withRouter } from "react-router-dom";
import Cookies from "universal-cookie";

function Login(props) {
    let [email, setEmail] = useState("");
    let [password, setPassword] = useState("");
    const cookies = new Cookies();

    let login = (e) => {
        e.preventDefault();
        axios
            .post("/api/v1/user/signIn", {
                email,
                password,
            })
            .then((response) => {
                if (response.data.accessToken) {
                    cookies.set(
                        "jwt",
                        response.data.accessToken,
                        { path: "/", maxAge: 24 * 60 * 60 }
                    );
                    props.history.push("/home");
                }
            })
            .catch((err) => {
                document.getElementById(
                    "error"
                ).innerHTML = err?.response?.data?.error
                    ? err.response.data.error
                    : "";
            });
    };

    return (
        <div className=" bg-bgCol h-screen flex items-center flex-col">
            <TempNav />
            <div className=" text-myGray bg-white mt-44 flex flex-col w-96 h-auto rounded-2xl overflow-hidden shadow-lg p-8">
                <h1 className="text-4xl text-myGray">
                    Login
                </h1>
                <div
                    id="error"
                    className="text-red-400"
                ></div>
                <form onSubmit={login}>
                    <h5 className="form-label">Email</h5>
                    <input
                        className="border border-gray-200 w-full px-4 py-2 rounded-md focus:outline-none"
                        type="email"
                        name="email"
                        id="email"
                        value={email}
                        required
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />
                    <h5 className="form-label">Password</h5>
                    <input
                        className="border border-gray-200 w-full px-4 py-2 rounded-md focus:outline-none"
                        type="password"
                        name="password"
                        id="password"
                        value={password}
                        required
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />
                    <button className="login__button mt-6 rounded-full bg-primaryCol border-0 uppercase py-2 px-6">
                        Login
                    </button>
                    {/* <button type='submit' className="login__button" onClick={login}>Login</button> */}
                </form>
            </div>
        </div>
    );
}

export default withRouter(Login);
