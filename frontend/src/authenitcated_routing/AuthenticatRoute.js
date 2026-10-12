import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import Cookies from 'universal-cookie';

export default (props) => {
    let {component: Component, ...rest} = props;
    return (
        <Route
            {...rest}
            render = {(props) => {
                let cookies = new Cookies();
                let jwt = cookies.get('jwt')
                return (
                    jwt ? (
                    <Component {...props} /> 
                    )
                        : 
                    <Redirect
                        to={{
                        pathname: "/login",
                        state: { from: props.location }
                        }}
                    />
                )
            }}
        />
    )
};