import * as actionTypes from './actionTypes';

const initState = {
    cartItems: []
}

let cartReducer = (state=initState, action) => {
    switch (action.type) {
        case actionTypes.POPULATE_THE_CART:
            return {
                ...state,
                cartItems: action.item,
            }

        case actionTypes.ADD_TO_CART:
            return {
                ...state,
                cartItems: [...state.cartItems, action.item],
            }

        case actionTypes.REMOVE_FROM_CART:
            const index = state.cartItems.findIndex(
                (cartItem) => (cartItem._id === action.id )
            )
            let newCartItems = [...state.cartItems];
            if(index >= 0){
                newCartItems.splice(index, 1);
            }
            return {
                ...state,
                cartItems: newCartItems,
            }

        default:
            return state;
    }
}

export default cartReducer
