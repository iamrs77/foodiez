import axios from "../utils/axios";
import React, { useEffect, useState } from "react";
import {
    Link,
    useParams,
    withRouter,
} from "react-router-dom";
import MenuItem from "./MenuItem";
import GetHeaders from "../utils/headers";
import { connect } from "react-redux";

function Menu({ role }) {
    let { vendorId } = useParams();
    let [menuItems, setMenuItems] = useState([]);

    let addMenuButton =
        role === "vendor" ? (
            <Link to={`/menu-form/${vendorId}`}>
                <button className="fixed right-5 top-20 btn btn-info">
                    Add Menu Item
                </button>
            </Link>
        ) : (
            <></>
        );

    useEffect(() => {
        let isMounted = true;
        if (isMounted) {
            axios
                .get(`/api/v1/fooditem/get/${vendorId}`, {
                    headers: GetHeaders(),
                })
                .then((response) => {
                    setMenuItems(response.data);
                });
        }
        return () => {
            isMounted = false;
        };
    }, [menuItems]);

    if (menuItems.length <= 0) {
        return (
            <div className=" text-center mt-16 text-lg font-bold">
                No Items Yet
                <div>{addMenuButton}</div>
            </div>
        );
    } else {
        return (
            <div className=" mt-16">
                {addMenuButton}
                <MenuItem menuItems={menuItems} />
            </div>
        );
    }
}
const mapStateToProps = (state) => {
    return {
        role: state.user.roleName,
    };
};
export default connect(mapStateToProps)(withRouter(Menu));
