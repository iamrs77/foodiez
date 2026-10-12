import axios from "../utils/axios";
import React, { useState } from "react";
import TempNav from "./TempNav";
import { withRouter } from "react-router-dom";
import Cookies from "universal-cookie";

function Register(props) {
    let [email, setEmail] = useState("");
    let [firstName, setFirstName] = useState("");
    let [lastName, setLastName] = useState("");
    let [password, setPassword] = useState("");
    let [passwordConfirm, setPasswordConfirm] = useState(
        ""
    );

    const cookies = new Cookies();

    let register = (e, userRole) => {
        e.preventDefault();
        if (password !== passwordConfirm) {
            document.getElementById("error").innerText =
                "Password don't match";
            return;
        } else {
            document.getElementById("error").innerText = "";
        }

        axios
            .post("/api/v1/user/register", {
                email,
                firstName,
                lastName,
                password,
                passwordConfirm,
                role: userRole,
            })
            .then((res) => {
                cookies.set("jwt", res.data.accessToken, {
                    path: "/",
                    maxAge: 24 * 60 * 60,
                });
                props.history.push("/home");
            })
            .catch((err) => {
                document.getElementById(
                    "error"
                ).innerHTML = err.response.data.error
                    ? err.response.data.error
                    : "";
            });
    };

    return (
        <div className="login  bg-bgCol h-screen flex items-center flex-col">
            <TempNav />
            <div className=" text-myGray bg-white mt-14 flex flex-col w-1/3 h-auto rounded-2xl overflow-hidden shadow-lg p-8">
                <h1 className="text-4xl text-myGray">
                    Register
                </h1>
                <div
                    id="error"
                    className="text-red-400"
                ></div>
                <form method="post" onSubmit={() => {}}>
                    <h5 className="form-label">Email</h5>
                    <input
                        className="border border-gray-200 w-full px-4 py-2 rounded-md focus:outline-none"
                        type="email"
                        name="email"
                        value={email}
                        required
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                    />
                    <h5 className="form-label">
                        First Name
                    </h5>
                    <input
                        className="border border-gray-200 w-full px-4 py-2 rounded-md focus:outline-none"
                        type="text"
                        name="firstName"
                        value={firstName}
                        required
                        onChange={(e) =>
                            setFirstName(e.target.value)
                        }
                    />
                    <h5 className="form-label">
                        Last Name
                    </h5>
                    <input
                        className="border border-gray-200 w-full px-4 py-2 rounded-md focus:outline-none"
                        type="text"
                        name="lastName"
                        value={lastName}
                        required
                        onChange={(e) =>
                            setLastName(e.target.value)
                        }
                    />
                    <h5 className="form-label">Password</h5>
                    <input
                        className="border border-gray-200 w-full px-4 py-2 rounded-md focus:outline-none"
                        type="password"
                        name="password"
                        value={password}
                        required
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />
                    <h5 className="form-label">
                        Confirm Password
                    </h5>
                    <input
                        className="border border-gray-200 w-full px-4 py-2 rounded-md focus:outline-none"
                        type="password"
                        name="passwordConfirm"
                        value={passwordConfirm}
                        required
                        onChange={(e) =>
                            setPasswordConfirm(
                                e.target.value
                            )
                        }
                    />
                    <div className=" flex justify-between items-center mt-3">
                        <button
                            className="  rounded-full bg-primaryCol border-0 uppercase py-2 px-6"
                            onClick={(e) => {
                                register(e, "user");
                            }}
                        >
                            Register
                        </button>
                        <button
                            className="btn  hover:bg-gray-100 rounded-full"
                            onClick={(e) => {
                                register(e, "vendor");
                            }}
                        >
                            Register as Vendor!
                        </button>
                    </div>

                    <div id="error"></div>
                </form>
            </div>
        </div>
    );
}

export default withRouter(Register);
