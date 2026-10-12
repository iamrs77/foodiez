import React from 'react'
import { Redirect, Route } from 'react-router-dom';
import Cookies from 'universal-cookie';
import jwt from 'jwt-decode';
import {connect} from 'react-redux'
import { addUserRole } from '../redux/actions/userActions';
import Login from '../components/Login';
import Register from '../components/Register';

function autheticatedNewRouting({path, userComponents, vendorComponents, dispatchRole}) {
    let cookies = new Cookies();
    let jwtToken = cookies.get('jwt')
    if((path==='/register' || path==='/login') && jwtToken ) {
        return(
            <Redirect to='/' />
        );
    }
    if(jwtToken){
        let user = jwt(jwtToken);
        dispatchRole(user.roleName);
        if(user.roleName === 'user'){
            if(userComponents.length <= 0){
                return(
                    <Redirect to='/' />
                )
            }
            let userComponentslist = userComponents?.map((component, index) => {
                return (<span key={index}>{component}</span>)
            })
            return (
                <Route path={path}>
                    {userComponentslist}
                </Route>
            )
        }else if (user.roleName === 'vendor'){
            if(vendorComponents.length <= 0){
                return(
                    <Redirect to='/' />
                )
            }
            let vendorComponentslist = vendorComponents?.map((component, index) => {
                return (<span key={index}>{component}</span>)
            })
            return (
                <Route path={path}>
                    {vendorComponentslist}
                </Route>
            )
        }
    }else{
        if(path === '/register'){
            return(
                <Route path={path}>
                        <Register />
                </Route>
            )
        }
        return(
            // <Redirect to='/login' />
            <Route path={path}>
                    <Login />
            </Route>
        )
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        dispatchRole: (roleName) => {dispatch(addUserRole(roleName))}
    }
}

export default connect(null, mapDispatchToProps)(autheticatedNewRouting);
