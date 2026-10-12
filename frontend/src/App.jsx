import { Route, Routes } from 'react-router';
import Layout from './components/Layout';
import RequireRole from './components/RequireRole';
import CartPage from './pages/CartPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import OrdersPage from './pages/OrdersPage';
import RegisterPage from './pages/RegisterPage';
import RestaurantPage from './pages/RestaurantPage';
import DishFormPage from './pages/vendor/DishFormPage';
import MyRestaurantsPage from './pages/vendor/MyRestaurantsPage';
import RestaurantFormPage from './pages/vendor/RestaurantFormPage';

export default function App() {
	return (
		<Routes>
			<Route element={<Layout />}>
				{/* open to everyone */}
				<Route index element={<HomePage />} />
				<Route path="restaurants/:id" element={<RestaurantPage />} />
				<Route path="login" element={<LoginPage />} />
				<Route path="register" element={<RegisterPage />} />

				<Route element={<RequireRole role="customer" />}>
					<Route path="cart" element={<CartPage />} />
					<Route path="orders" element={<OrdersPage />} />
				</Route>

				<Route path="vendor" element={<RequireRole role="vendor" />}>
					<Route index element={<MyRestaurantsPage />} />
					<Route
						path="restaurants/new"
						element={<RestaurantFormPage />}
					/>
					<Route
						path="restaurants/:id/edit"
						element={<RestaurantFormPage />}
					/>
					<Route
						path="restaurants/:id/dishes/new"
						element={<DishFormPage />}
					/>
					<Route
						path="restaurants/:id/dishes/:dishId/edit"
						element={<DishFormPage />}
					/>
				</Route>

				<Route path="*" element={<NotFoundPage />} />
			</Route>
		</Routes>
	);
}
