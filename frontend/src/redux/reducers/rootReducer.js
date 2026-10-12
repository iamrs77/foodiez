import cartReducer from './cart/cartReducer';
import userReducer from './user/userReducer';

import {combineReducers} from 'redux';

const rootReducer = combineReducers({
    cart: cartReducer,
    user: userReducer,
})

export default rootReducer;