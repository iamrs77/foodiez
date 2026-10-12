import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { loggedOut } from '../features/auth/authSlice';

const rawBaseQuery = fetchBaseQuery({
	// "/api" is passed on to the backend by Vite in development and by nginx in Docker
	baseUrl: import.meta.env.VITE_API_URL ?? '/api',
	prepareHeaders: (headers, { getState }) => {
		const { token } = getState().auth;
		if (token) {
			headers.set('Authorization', `Bearer ${token}`);
		}
		return headers;
	},
});

// logging out also forgets cached data like the cart
export const logout = () => (dispatch) => {
	dispatch(loggedOut());
	dispatch(api.util.resetApiState());
};

// a 401 while logged in means the session expired, so log out
async function baseQuery(args, queryApi, extraOptions) {
	const result = await rawBaseQuery(args, queryApi, extraOptions);
	if (result.error?.status === 401 && queryApi.getState().auth.token) {
		queryApi.dispatch(logout());
	}
	return result;
}

// cart endpoints answer with the whole cart, so the cached cart is replaced
// directly instead of fetching it again
async function storeCart(_arg, { dispatch, queryFulfilled }) {
	try {
		const { data } = await queryFulfilled;
		dispatch(api.util.upsertQueryData('getCart', undefined, data));
	} catch {
		// the component shows the error
	}
}

export const api = createApi({
	baseQuery,
	tagTypes: ['Restaurant', 'Dish', 'Cart', 'Order'],
	endpoints: (build) => ({
		login: build.mutation({
			query: (body) => ({ url: '/auth/login', method: 'POST', body }),
		}),
		register: build.mutation({
			query: (body) => ({ url: '/auth/register', method: 'POST', body }),
		}),

		getRestaurants: build.query({
			query: (search = '') => ({
				url: '/restaurants',
				params: search ? { search } : undefined,
			}),
			providesTags: ['Restaurant'],
		}),
		getMyRestaurants: build.query({
			query: () => '/restaurants/mine',
			providesTags: ['Restaurant'],
		}),
		getRestaurant: build.query({
			query: (id) => `/restaurants/${id}`,
			providesTags: ['Restaurant'],
		}),
		createRestaurant: build.mutation({
			query: (body) => ({ url: '/restaurants', method: 'POST', body }),
			invalidatesTags: ['Restaurant'],
		}),
		updateRestaurant: build.mutation({
			query: ({ id, ...body }) => ({
				url: `/restaurants/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: ['Restaurant'],
		}),
		deleteRestaurant: build.mutation({
			query: (id) => ({ url: `/restaurants/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Restaurant', 'Cart'],
		}),

		getDishes: build.query({
			query: (restaurantId) => `/restaurants/${restaurantId}/dishes`,
			providesTags: ['Dish'],
		}),
		createDish: build.mutation({
			query: ({ restaurantId, ...body }) => ({
				url: `/restaurants/${restaurantId}/dishes`,
				method: 'POST',
				body,
			}),
			invalidatesTags: ['Dish'],
		}),
		updateDish: build.mutation({
			query: ({ id, ...body }) => ({
				url: `/dishes/${id}`,
				method: 'PATCH',
				body,
			}),
			invalidatesTags: ['Dish', 'Cart'],
		}),
		deleteDish: build.mutation({
			query: (id) => ({ url: `/dishes/${id}`, method: 'DELETE' }),
			invalidatesTags: ['Dish', 'Cart'],
		}),

		getCart: build.query({
			query: () => '/cart',
			providesTags: ['Cart'],
		}),
		addToCart: build.mutation({
			query: ({ dishId, quantity = 1 }) => ({
				url: '/cart/items',
				method: 'POST',
				body: { dishId, quantity },
			}),
			onQueryStarted: storeCart,
		}),
		updateCartItem: build.mutation({
			query: ({ id, quantity }) => ({
				url: `/cart/items/${id}`,
				method: 'PATCH',
				body: { quantity },
			}),
			onQueryStarted: storeCart,
		}),
		removeCartItem: build.mutation({
			query: (id) => ({ url: `/cart/items/${id}`, method: 'DELETE' }),
			onQueryStarted: storeCart,
		}),
		clearCart: build.mutation({
			query: () => ({ url: '/cart', method: 'DELETE' }),
			onQueryStarted: storeCart,
		}),

		getOrders: build.query({
			query: () => '/orders',
			providesTags: ['Order'],
		}),
		placeOrder: build.mutation({
			query: () => ({ url: '/orders', method: 'POST' }),
			invalidatesTags: ['Order', 'Cart'],
		}),
	}),
});

export const {
	useLoginMutation,
	useRegisterMutation,
	useGetRestaurantsQuery,
	useGetMyRestaurantsQuery,
	useGetRestaurantQuery,
	useCreateRestaurantMutation,
	useUpdateRestaurantMutation,
	useDeleteRestaurantMutation,
	useGetDishesQuery,
	useCreateDishMutation,
	useUpdateDishMutation,
	useDeleteDishMutation,
	useGetCartQuery,
	useAddToCartMutation,
	useUpdateCartItemMutation,
	useRemoveCartItemMutation,
	useClearCartMutation,
	useGetOrdersQuery,
	usePlaceOrderMutation,
} = api;
