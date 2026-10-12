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
];

export const demoRestaurants = [
	{
		ownerEmail: 'vendor@foodiez.dev',
		name: 'Spice Route',
		cuisine: 'North Indian',
		location: 'HSR Layout, Bengaluru',
		priceForTwo: 600,
		deliveryTimeMinutes: 30,
		dishes: [
			{
				name: 'Paneer Butter Masala',
				description: 'Cottage cheese in a rich tomato and butter gravy',
				price: 280,
				isVeg: true,
			},
			{
				name: 'Dal Makhani',
				description: 'Black lentils slow cooked overnight with cream',
				price: 220,
				isVeg: true,
			},
			{
				name: 'Butter Chicken',
				description:
					'Tandoori chicken in a smooth, mildly spiced gravy',
				price: 340,
				isVeg: false,
			},
			{
				name: 'Garlic Naan',
				description:
					'Soft bread from the tandoor, brushed with garlic butter',
				price: 60,
				isVeg: true,
			},
			{
				name: 'Jeera Rice',
				description: 'Basmati rice tossed with cumin',
				price: 150,
				isVeg: true,
			},
		],
	},
	{
		ownerEmail: 'vendor@foodiez.dev',
		name: 'Napoli Slice',
		cuisine: 'Italian, Pizza',
		location: 'Indiranagar, Bengaluru',
		priceForTwo: 800,
		deliveryTimeMinutes: 35,
		dishes: [
			{
				name: 'Margherita Pizza',
				description: 'Tomato, mozzarella and fresh basil',
				price: 320,
				isVeg: true,
			},
			{
				name: 'Farmhouse Pizza',
				description: 'Peppers, onion, mushroom and sweet corn',
				price: 380,
				isVeg: true,
			},
			{
				name: 'Pepperoni Pizza',
				description: 'Spicy pepperoni with extra cheese',
				price: 450,
				isVeg: false,
			},
			{
				name: 'Penne Arrabbiata',
				description: 'Penne in a spicy tomato and garlic sauce',
				price: 290,
				isVeg: true,
			},
			{
				name: 'Tiramisu',
				description: 'Coffee soaked sponge with mascarpone',
				price: 220,
				isVeg: true,
			},
		],
	},
	{
		ownerEmail: 'vendor@foodiez.dev',
		name: 'Dosa Corner',
		cuisine: 'South Indian',
		location: 'Jayanagar, Bengaluru',
		priceForTwo: 300,
		deliveryTimeMinutes: 20,
		dishes: [
			{
				name: 'Masala Dosa',
				description:
					'Crispy dosa with spiced potato, chutney and sambar',
				price: 120,
				isVeg: true,
			},
			{
				name: 'Idli Sambar',
				description: 'Three steamed rice cakes with sambar',
				price: 80,
				isVeg: true,
			},
			{
				name: 'Medu Vada',
				description: 'Crispy lentil doughnuts with coconut chutney',
				price: 90,
				isVeg: true,
			},
			{
				name: 'Filter Coffee',
				description: 'Strong South Indian coffee with milk',
				price: 40,
				isVeg: true,
			},
		],
	},
	{
		ownerEmail: 'vendor2@foodiez.dev',
		name: 'Wok Express',
		cuisine: 'Chinese',
		location: 'Koramangala, Bengaluru',
		priceForTwo: 500,
		deliveryTimeMinutes: 25,
		dishes: [
			{
				name: 'Veg Hakka Noodles',
				description: 'Wok tossed noodles with crunchy vegetables',
				price: 210,
				isVeg: true,
			},
			{
				name: 'Chilli Chicken',
				description: 'Crispy chicken tossed with peppers and soy',
				price: 260,
				isVeg: false,
			},
			{
				name: 'Veg Manchurian',
				description: 'Vegetable balls in a tangy garlic sauce',
				price: 220,
				isVeg: true,
			},
			{
				name: 'Chicken Fried Rice',
				description: 'Fried rice with egg, chicken and spring onion',
				price: 240,
				isVeg: false,
			},
		],
	},
	{
		ownerEmail: 'vendor2@foodiez.dev',
		name: 'Burger Barn',
		cuisine: 'Burgers, Fast Food',
		location: 'Whitefield, Bengaluru',
		priceForTwo: 450,
		deliveryTimeMinutes: 30,
		dishes: [
			{
				name: 'Classic Veg Burger',
				description:
					'Crispy veg patty, lettuce, tomato and house sauce',
				price: 150,
				isVeg: true,
			},
			{
				name: 'Crispy Chicken Burger',
				description: 'Fried chicken fillet with spicy mayo',
				price: 210,
				isVeg: false,
			},
			{
				name: 'Peri Peri Fries',
				description: 'Fries tossed in peri peri seasoning',
				price: 120,
				isVeg: true,
			},
			{
				name: 'Chocolate Shake',
				description: 'Thick shake with dark chocolate',
				price: 160,
				isVeg: true,
			},
		],
	},
];

// past orders for the demo customer, so Order History isn't empty
export const demoOrders = [
	{
		restaurantName: 'Dosa Corner',
		daysAgo: 2,
		items: [
			{ name: 'Masala Dosa', quantity: 2 },
			{ name: 'Filter Coffee', quantity: 2 },
		],
	},
	{
		restaurantName: 'Spice Route',
		daysAgo: 6,
		items: [
			{ name: 'Paneer Butter Masala', quantity: 1 },
			{ name: 'Garlic Naan', quantity: 3 },
		],
	},
];
