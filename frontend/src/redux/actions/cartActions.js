import axios from '../../utils/axios'
import GetHeaders from '../../utils/headers'
import * as actionTypes from '../reducers/cart/actionTypes'

export const removeFromCart = (id) => {
    return (dispatch, getState) => {
        axios.delete(`/api/v1/cart/removeFromCart/${id}`,{headers: GetHeaders()}).then(res => {
            dispatch({type: actionTypes.REMOVE_FROM_CART, id})
        }).catch(err => 
            console.log(err)
        )
    }
}

export const addToCart = (item) => {
    return (dispatch, getState) => {
        axios.post(`/api/v1/cart/addToCart`, {foodItem: item._id} ,{headers: GetHeaders()}).then(res => {
            dispatch({type: actionTypes.ADD_TO_CART, item})
        }).catch(err => 
            console.log(err)
        )
    }
}

export const populateTheCart = (role) => {
    return (dispatch, getState) => {
        role === 'vendor' ? 
            dispatch({type: actionTypes.POPULATE_THE_CART, item: []}) 
            : 
            axios.get('/api/v1/cart/getAllForUser',{headers: GetHeaders()}).then(response => {
                dispatch({type: 'POPULATE_THE_CART', item: response.data})
            })
    }
}