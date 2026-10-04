const defaultMenu = [
  { id: 1, name: "Paneer Tikka Bowl", category: "Bowls", price: 249, type: "Veg", rating: 4.8, emoji: "🍛", description: "Smoky paneer, rice, salad and mint dressing." },
  { id: 2, name: "Chicken Tikka Bowl", category: "Bowls", price: 289, type: "Non-Veg", rating: 4.9, emoji: "🍗", description: "Spiced chicken tikka, rice, greens and house sauce." },
  { id: 3, name: "Margherita Pizza", category: "Pizza", price: 229, type: "Veg", rating: 4.6, emoji: "🍕", description: "Classic tomato, mozzarella and basil pizza." },
  { id: 4, name: "Farmhouse Pizza", category: "Pizza", price: 299, type: "Veg", rating: 4.7, emoji: "🍕", description: "Loaded with capsicum, onion, corn and mushrooms." },
  { id: 5, name: "Chicken Burger", category: "Burgers", price: 219, type: "Non-Veg", rating: 4.7, emoji: "🍔", description: "Crispy chicken, lettuce and signature sauce." },
  { id: 6, name: "Veg Crunch Burger", category: "Burgers", price: 179, type: "Veg", rating: 4.5, emoji: "🍔", description: "Crispy veg patty, cheese, lettuce and sauce." },
  { id: 7, name: "White Sauce Pasta", category: "Pasta", price: 239, type: "Veg", rating: 4.6, emoji: "🍝", description: "Creamy pasta with herbs, corn and vegetables." },
  { id: 8, name: "Chicken Arrabbiata", category: "Pasta", price: 279, type: "Non-Veg", rating: 4.8, emoji: "🍝", description: "Spicy tomato pasta with grilled chicken." },
  { id: 9, name: "Peri Peri Fries", category: "Sides", price: 129, type: "Veg", rating: 4.5, emoji: "🍟", description: "Crispy fries tossed in peri peri seasoning." },
  { id: 10, name: "Cheesy Garlic Bread", category: "Sides", price: 149, type: "Veg", rating: 4.7, emoji: "🥖", description: "Toasted garlic bread topped with melted cheese." },
  { id: 11, name: "Chocolate Brownie", category: "Desserts", price: 139, type: "Veg", rating: 4.9, emoji: "🍫", description: "Warm fudgy brownie with chocolate drizzle." },
  { id: 12, name: "Cold Coffee", category: "Drinks", price: 149, type: "Veg", rating: 4.8, emoji: "🥤", description: "Chilled creamy coffee topped with foam." }
];

function getMenuData() {
  const stored = localStorage.getItem("urbanbite_menu");
  if (stored) return JSON.parse(stored);
  localStorage.setItem("urbanbite_menu", JSON.stringify(defaultMenu));
  return [...defaultMenu];
}
function saveMenuData(menu) {
  localStorage.setItem("urbanbite_menu", JSON.stringify(menu));
}
