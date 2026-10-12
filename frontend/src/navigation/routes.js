import React from "react";
import Navbar from "../components/Navbar";
import Menu from "../components/Menu";
import Home from "../components/Home";
import Cart from "../components/Cart";
import VendorHome from "../components/vendorComponents/VendorHome";
import VendorNavbar from "../components/vendorComponents/VendorNavbar";
import OrderHistory from "../components/OrderHistory";
import MenuForm from "../components/vendorComponents/MenuForm";
import RetaurantForm from "../components/vendorComponents/RetaurantForm";
import Login from "../components/Login";
import Register from "../components/Register";

let routes = [
    {
        key: 1,
        path: "/menu/:vendorId",
        userComponents: [<Navbar />, <Menu />],
        vendorComponents: [<VendorNavbar />, <Menu />],
    },
    {
        key: 2,
        path: "/orderHistory",
        userComponents: [<Navbar />, <OrderHistory />],
        vendorComponents: [],
    },
    {
        key: 3,
        path: "/cart",
        userComponents: [<Navbar />, <Cart />],
        vendorComponents: [],
    },
    {
        key: 4,
        path: "/menu-form/:vendorId",
        userComponents: [],
        vendorComponents: [<VendorNavbar />, <MenuForm />],
    },
    {
        key: 5,
        path: "/restaurant-form",
        userComponents: [],
        vendorComponents: [
            <VendorNavbar />,
            <RetaurantForm />,
        ],
    },
    {
        key: 6,
        path: "/login",
        userComponents: [<Login />],
        vendorComponents: [],
    },
    {
        key: 7,
        path: "/register",
        userComponents: [<Register />],
        vendorComponents: [],
    },
    {
        key: 8,
        path: "/",
        userComponents: [<Navbar />, <Home />],
        vendorComponents: [
            <VendorNavbar />,
            <VendorHome />,
        ],
    },
];

export default routes;
