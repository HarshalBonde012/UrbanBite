const defaultMenu = [
  { id: 1, name: "Paneer Tikka Bowl", category: "Bowls", price: 249, type: "Veg", rating: 4.8, image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Smoky paneer, rice, salad and mint dressing." },
  { id: 2, name: "Chicken Tikka Bowl", category: "Bowls", price: 289, type: "Non-Veg", rating: 4.9, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Spiced chicken tikka, rice, greens and house sauce." },
  { id: 3, name: "Margherita Pizza", category: "Pizza", price: 229, type: "Veg", rating: 4.6, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Classic tomato, mozzarella and basil pizza." },
  { id: 4, name: "Farmhouse Pizza", category: "Pizza", price: 299, type: "Veg", rating: 4.7, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Loaded with capsicum, onion, corn and mushrooms." },
  { id: 5, name: "Chicken Burger", category: "Burgers", price: 219, type: "Non-Veg", rating: 4.7, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Crispy chicken, lettuce and signature sauce." },
  { id: 6, name: "Veg Crunch Burger", category: "Burgers", price: 179, type: "Veg", rating: 4.5, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Crispy veg patty, cheese, lettuce and sauce." },
  { id: 7, name: "White Sauce Pasta", category: "Pasta", price: 239, type: "Veg", rating: 4.6, image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Creamy pasta with herbs, corn and vegetables." },
  { id: 8, name: "Chicken Arrabbiata", category: "Pasta", price: 279, type: "Non-Veg", rating: 4.8, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Spicy tomato pasta with grilled chicken." },
  { id: 9, name: "Peri Peri Fries", category: "Sides", price: 129, type: "Veg", rating: 4.5, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Crispy fries tossed in peri peri seasoning." },
  { id: 10, name: "Cheesy Garlic Bread", category: "Sides", price: 149, type: "Veg", rating: 4.7, image: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Toasted garlic bread topped with melted cheese." },
  { id: 11, name: "Chocolate Brownie", category: "Desserts", price: 139, type: "Veg", rating: 4.9, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Warm fudgy brownie with chocolate drizzle." },
  { id: 12, name: "Cold Coffee", category: "Drinks", price: 149, type: "Veg", rating: 4.8, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=80", emoji: "", available: true, description: "Chilled creamy coffee topped with foam." }
];

function normalizeMenuItem(item) {
  const fallback = defaultMenu.find(defaultItem => Number(defaultItem.id) === Number(item.id)) || {};
  return {
    ...fallback,
    ...item,
    id: Number(item.id),
    price: Number(item.price || fallback.price || 0),
    rating: Number(item.rating || fallback.rating || 4.5),
    image: item.image || fallback.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80",
    available: item.available !== false
  };
}

function getMenuData() {
  const stored = localStorage.getItem("urbanbite_menu");
  if (stored) {
    const normalized = JSON.parse(stored).map(normalizeMenuItem);
    localStorage.setItem("urbanbite_menu", JSON.stringify(normalized));
    return normalized;
  }
  localStorage.setItem("urbanbite_menu", JSON.stringify(defaultMenu));
  return defaultMenu.map(item => ({ ...item }));
}

function saveMenuData(menu) {
  localStorage.setItem("urbanbite_menu", JSON.stringify(menu.map(normalizeMenuItem)));
}
