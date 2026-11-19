// Demo accounts and restaurants, so the app isn't empty on first start.
// Every demo account uses the same password.
export const DEMO_PASSWORD = 'password123';

export const demoUsers = [
	{
		email: 'customer@foodiez.dev',
		firstName: 'Priya',
		lastName: 'Nair',
		role: 'customer',
	},
	{
		email: 'vendor@foodiez.dev',
		firstName: 'Asha',
		lastName: 'Rao',
		role: 'vendor',
	},
	{
		email: 'vendor2@foodiez.dev',
		firstName: 'Vikram',
		lastName: 'Mehta',
		role: 'vendor',
	},
	{
		email: 'customer2@foodiez.dev',
		firstName: 'Rahul',
		lastName: 'Verma',
		role: 'customer',
	},
];

export const demoRestaurants = [
	{
		ownerEmail: 'vendor@foodiez.dev',
		name: 'Spice Route',
		image: '/images/restaurants/spice-route.webp',
		cuisine: 'North Indian',
		location: 'HSR Layout, Bengaluru',
		priceForTwo: 600,
		deliveryTimeMinutes: 30,
		dishes: [
			{
				name: 'Paneer Butter Masala',
				category: 'Curries',
				image: '/images/dishes/paneer-butter-masala.webp',
				description: 'Cottage cheese in a rich tomato and butter gravy',
				price: 280,
				isVeg: true,
			},
			{
				name: 'Dal Makhani',
				category: 'Curries',
				image: '/images/dishes/dal-makhani.webp',
				description: 'Black lentils slow cooked overnight with cream',
				price: 220,
				isVeg: true,
			},
			{
				name: 'Butter Chicken',
				category: 'Curries',
				image: '/images/dishes/butter-chicken.webp',
				description:
					'Tandoori chicken in a smooth, mildly spiced gravy',
				price: 340,
				isVeg: false,
			},
			{
				name: 'Garlic Naan',
				category: 'Breads',
				image: '/images/dishes/garlic-naan.webp',
				description:
					'Soft bread from the tandoor, brushed with garlic butter',
				price: 60,
				isVeg: true,
			},
			{
				name: 'Jeera Rice',
				category: 'Rice',
				image: '/images/dishes/jeera-rice.webp',
				description: 'Basmati rice tossed with cumin',
				price: 150,
				isVeg: true,
			},
		],
	},
	{
		ownerEmail: 'vendor@foodiez.dev',
		name: 'Napoli Slice',
		image: '/images/restaurants/napoli-slice.webp',
		cuisine: 'Italian, Pizza',
		location: 'Indiranagar, Bengaluru',
		priceForTwo: 800,
		deliveryTimeMinutes: 35,
		dishes: [
			{
				name: 'Margherita Pizza',
				category: 'Pizzas',
				image: '/images/dishes/margherita-pizza.webp',
				description: 'Tomato, mozzarella and fresh basil',
				price: 320,
				isVeg: true,
			},
			{
				name: 'Farmhouse Pizza',
				category: 'Pizzas',
				image: '/images/dishes/farmhouse-pizza.webp',
				description: 'Peppers, onion, mushroom and sweet corn',
				price: 380,
				isVeg: true,
			},
			{
				name: 'Pepperoni Pizza',
				category: 'Pizzas',
				image: '/images/dishes/pepperoni-pizza.webp',
				description: 'Spicy pepperoni with extra cheese',
				price: 450,
				isVeg: false,
			},
			{
				name: 'Penne Arrabbiata',
				category: 'Pasta',
				image: '/images/dishes/penne-arrabbiata.webp',
				description: 'Penne in a spicy tomato and garlic sauce',
				price: 290,
				isVeg: true,
			},
			{
				name: 'Tiramisu',
				category: 'Desserts',
				image: '/images/dishes/tiramisu.webp',
				description: 'Coffee soaked sponge with mascarpone',
				price: 220,
				isVeg: true,
			},
		],
	},
	{
		ownerEmail: 'vendor@foodiez.dev',
		name: 'Dosa Corner',
		image: '/images/restaurants/dosa-corner.webp',
		cuisine: 'South Indian',
		location: 'Jayanagar, Bengaluru',
		priceForTwo: 300,
		deliveryTimeMinutes: 20,
		dishes: [
			{
				name: 'Masala Dosa',
				category: 'Dosas',
				image: '/images/dishes/masala-dosa.webp',
				description:
					'Crispy dosa with spiced potato, chutney and sambar',
				price: 120,
				isVeg: true,
			},
			{
				name: 'Idli Sambar',
				category: 'Tiffin',
				image: '/images/dishes/idli-sambar.webp',
				description: 'Three steamed rice cakes with sambar',
				price: 80,
				isVeg: true,
			},
			{
				name: 'Medu Vada',
				category: 'Tiffin',
				image: '/images/dishes/medu-vada.webp',
				description: 'Crispy lentil doughnuts with coconut chutney',
				price: 90,
				isVeg: true,
			},
			{
				name: 'Filter Coffee',
				category: 'Drinks',
				image: '/images/dishes/filter-coffee.webp',
				description: 'Strong South Indian coffee with milk',
				price: 40,
				isVeg: true,
			},
		],
	},
	{
		ownerEmail: 'vendor2@foodiez.dev',
		name: 'Wok Express',
		image: '/images/restaurants/wok-express.webp',
		cuisine: 'Chinese',
		location: 'Koramangala, Bengaluru',
		priceForTwo: 500,
		deliveryTimeMinutes: 25,
		dishes: [
			{
				name: 'Chilli Chicken',
				category: 'Starters',
				image: '/images/dishes/chilli-chicken.webp',
				description: 'Crispy chicken tossed with peppers and soy',
				price: 260,
				isVeg: false,
			},
			{
				name: 'Veg Manchurian',
				category: 'Starters',
				image: '/images/dishes/veg-manchurian.webp',
				description: 'Vegetable balls in a tangy garlic sauce',
				price: 220,
				isVeg: true,
			},
			{
				name: 'Veg Hakka Noodles',
				category: 'Noodles and rice',
				image: '/images/dishes/veg-hakka-noodles.webp',
				description: 'Wok tossed noodles with crunchy vegetables',
				price: 210,
				isVeg: true,
			},
			{
				name: 'Chicken Fried Rice',
				category: 'Noodles and rice',
				image: '/images/dishes/chicken-fried-rice.webp',
				description: 'Fried rice with egg, chicken and spring onion',
				price: 240,
				isVeg: false,
			},
		],
	},
	{
		ownerEmail: 'vendor2@foodiez.dev',
		name: 'Burger Barn',
		image: '/images/restaurants/burger-barn.webp',
		cuisine: 'Burgers, Fast Food',
		location: 'Whitefield, Bengaluru',
		priceForTwo: 450,
		deliveryTimeMinutes: 30,
		dishes: [
			{
				name: 'Classic Veg Burger',
				category: 'Burgers',
				image: '/images/dishes/classic-veg-burger.webp',
				description:
					'Crispy veg patty, lettuce, tomato and house sauce',
				price: 150,
				isVeg: true,
			},
			{
				name: 'Crispy Chicken Burger',
				category: 'Burgers',
				image: '/images/dishes/crispy-chicken-burger.webp',
				description: 'Fried chicken fillet with spicy mayo',
				price: 210,
				isVeg: false,
			},
			{
				name: 'Peri Peri Fries',
				category: 'Sides',
				image: '/images/dishes/peri-peri-fries.webp',
				description: 'Fries tossed in peri peri seasoning',
				price: 120,
				isVeg: true,
			},
			{
				name: 'Chocolate Shake',
				category: 'Shakes',
				image: '/images/dishes/chocolate-shake.webp',
				// sold out, so the demo shows how that looks
				available: false,
				description: 'Thick shake with dark chocolate',
				price: 160,
				isVeg: true,
			},
		],
	},
];

const PRIYA_DELIVERY = {
	address:
		'Flat 302, Lakeview Apartments, 5th Cross, Koramangala, Bengaluru 560034',
	phone: '+91 98450 12345',
	note: '',
};

// orders already placed: two delivered ones in the demo customer's history, and
// a new one from another customer, waiting for Asha (the demo restaurant owner)
// to accept it
export const demoOrders = [
	{
		customerEmail: 'customer2@foodiez.dev',
		restaurantName: 'Napoli Slice',
		minutesAgo: 4,
		status: 'placed',
		delivery: {
			address:
				'12, 2nd Main, HAL 2nd Stage, Indiranagar, Bengaluru 560038',
			phone: '+91 99001 54321',
			note: 'Please ring the bell twice',
		},
		items: [
			{ name: 'Margherita Pizza', quantity: 1 },
			{ name: 'Tiramisu', quantity: 2 },
		],
	},
	{
		customerEmail: 'customer@foodiez.dev',
		restaurantName: 'Dosa Corner',
		minutesAgo: 2 * 24 * 60,
		status: 'delivered',
		delivery: PRIYA_DELIVERY,
		items: [
			{ name: 'Masala Dosa', quantity: 2 },
			{ name: 'Filter Coffee', quantity: 2 },
		],
	},
	{
		customerEmail: 'customer@foodiez.dev',
		restaurantName: 'Spice Route',
		minutesAgo: 6 * 24 * 60,
		status: 'delivered',
		delivery: {
			...PRIYA_DELIVERY,
			note: 'Leave it with the security guard',
		},
		items: [
			{ name: 'Paneer Butter Masala', quantity: 1 },
			{ name: 'Garlic Naan', quantity: 3 },
		],
	},
];
