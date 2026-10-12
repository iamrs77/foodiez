import * as actionTypes from '../reducers/user/actionTypes'

export const addUserRole = (roleName) => {
    return (dispatch, getState) => {
        dispatch({type: actionTypes.ADD_USER_ROLE, roleName})
    }
}