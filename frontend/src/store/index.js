import { persistReducer } from 'redux-persist'
import { createStore, applyMiddleware } from 'redux';
import storage from 'redux-persist/lib/storage';
import rootReducer from '../redux/reducers/rootReducer';

import thunk from 'redux-thunk';
const persistConfig = {
    key: 'root',
    storage,
}

const persistedReducer = persistReducer(persistConfig, rootReducer)
const store = createStore(persistedReducer, applyMiddleware(thunk))

export default store;

// for react native
// const persistConfig = {
//     key: 'root',
//     storage: AsyncStorage,
//     whitelist: [
//         'authReducer',
//     ],
//     blacklist: [
//         'counterReducer',
//     ],
// };