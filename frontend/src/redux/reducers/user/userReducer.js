import * as actionTypes from './actionTypes';

const initState = {
    roleName: null,
}

let userReducer = (state=initState, action) => {
    switch (action.type) {
        case actionTypes.ADD_USER_ROLE:
            return {
                ...state,
                roleName: action.roleName,
            }
        default:
            return state;
    }
}

export default userReducer
