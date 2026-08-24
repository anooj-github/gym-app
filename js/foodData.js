// Wolfpack Food & Nutrition Database
const DEFAULT_FOOD_DATABASE = [
  // Proteins & Meats
  { id: 'f1', name: 'Chicken Breast (Cooked)', category: 'Protein', servingSize: 100, unit: 'g', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'f2', name: 'Lean Beef Mince (90/10)', category: 'Protein', servingSize: 100, unit: 'g', calories: 215, protein: 26, carbs: 0, fat: 12 },
  { id: 'f3', name: 'Salmon Fillet (Grilled)', category: 'Protein', servingSize: 100, unit: 'g', calories: 206, protein: 22, carbs: 0, fat: 12.3 },
  { id: 'f4', name: 'Canned Tuna in Water', category: 'Protein', servingSize: 100, unit: 'g', calories: 116, protein: 26, carbs: 0, fat: 0.8 },
  { id: 'f5', name: 'Whole Eggs (Large)', category: 'Protein', servingSize: 1, unit: 'egg (50g)', calories: 74, protein: 6.3, carbs: 0.4, fat: 5 },
  { id: 'f6', name: 'Egg Whites (Liquid/Cooked)', category: 'Protein', servingSize: 100, unit: 'g', calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  { id: 'f7', name: 'Whey Protein Powder', category: 'Supplements', servingSize: 30, unit: 'g (1 scoop)', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { id: 'f8', name: 'Tofu (Firm)', category: 'Protein', servingSize: 100, unit: 'g', calories: 83, protein: 10, carbs: 2, fat: 4.8 },
  { id: 'f9', name: 'Turkey Breast Slices', category: 'Protein', servingSize: 100, unit: 'g', calories: 104, protein: 22, carbs: 1.5, fat: 1.2 },
  { id: 'f10', name: 'Cottage Cheese (Low Fat)', category: 'Dairy', servingSize: 100, unit: 'g', calories: 86, protein: 12, carbs: 3.4, fat: 2.3 },

  // Carbohydrates & Grains
  { id: 'f11', name: 'White Rice (Cooked)', category: 'Carbs', servingSize: 100, unit: 'g', calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
  { id: 'f12', name: 'Brown Rice (Cooked)', category: 'Carbs', servingSize: 100, unit: 'g', calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9 },
  { id: 'f13', name: 'Rolled Oats (Raw)', category: 'Carbs', servingSize: 50, unit: 'g (1/2 cup)', calories: 189, protein: 6.8, carbs: 33.5, fat: 3.5 },
  { id: 'f14', name: 'Sweet Potato (Baked)', category: 'Carbs', servingSize: 100, unit: 'g', calories: 90, protein: 2, carbs: 20.7, fat: 0.2 },
  { id: 'f15', name: 'Whole Wheat Bread', category: 'Carbs', servingSize: 1, unit: 'slice (40g)', calories: 95, protein: 4, carbs: 18, fat: 1.1 },
  { id: 'f16', name: 'Pasta (Cooked)', category: 'Carbs', servingSize: 100, unit: 'g', calories: 158, protein: 5.8, carbs: 31, fat: 0.9 },
  { id: 'f17', name: 'Quinoa (Cooked)', category: 'Carbs', servingSize: 100, unit: 'g', calories: 120, protein: 4.4, carbs: 21.3, fat: 1.9 },
  { id: 'f18', name: 'Boiled Potatoes', category: 'Carbs', servingSize: 100, unit: 'g', calories: 87, protein: 1.9, carbs: 20.1, fat: 0.1 },
  { id: 'f19', name: 'Tortilla Wrap (Whole Wheat)', category: 'Carbs', servingSize: 1, unit: 'wrap (60g)', calories: 180, protein: 5, carbs: 30, fat: 3.5 },

  // Dairy & Alternatives
  { id: 'f20', name: 'Greek Yogurt (0% Fat)', category: 'Dairy', servingSize: 150, unit: 'g', calories: 88, protein: 15, carbs: 5.5, fat: 0.3 },
  { id: 'f21', name: 'Whole Milk', category: 'Dairy', servingSize: 250, unit: 'ml (1 glass)', calories: 152, protein: 8, carbs: 12, fat: 8 },
  { id: 'f22', name: 'Skimmed Milk', category: 'Dairy', servingSize: 250, unit: 'ml (1 glass)', calories: 86, protein: 8.5, carbs: 12.2, fat: 0.5 },
  { id: 'f23', name: 'Almond Milk (Unsweetened)', category: 'Dairy', servingSize: 250, unit: 'ml', calories: 35, protein: 1, carbs: 1.5, fat: 2.5 },
  { id: 'f24', name: 'Cheddar Cheese', category: 'Dairy', servingSize: 30, unit: 'g (1 slice)', calories: 120, protein: 7, carbs: 0.4, fat: 10 },

  // Fats & Nuts
  { id: 'f25', name: 'Peanut Butter (Natural)', category: 'Fats', servingSize: 32, unit: 'g (2 tbsp)', calories: 190, protein: 8, carbs: 7, fat: 16 },
  { id: 'f26', name: 'Almonds (Raw)', category: 'Fats', servingSize: 30, unit: 'g (handful)', calories: 175, protein: 6, carbs: 6, fat: 15 },
  { id: 'f27', name: 'Avocado', category: 'Fats', servingSize: 100, unit: 'g (1/2 med)', calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { id: 'f28', name: 'Olive Oil', category: 'Fats', servingSize: 14, unit: 'g (1 tbsp)', calories: 120, protein: 0, carbs: 0, fat: 13.5 },
  { id: 'f29', name: 'Walnuts', category: 'Fats', servingSize: 30, unit: 'g', calories: 195, protein: 4.5, carbs: 4, fat: 20 },
  { id: 'f30', name: 'Chia Seeds', category: 'Fats', servingSize: 15, unit: 'g (1 tbsp)', calories: 73, protein: 2.5, carbs: 6.3, fat: 4.6 },

  // Fruits
  { id: 'f31', name: 'Banana', category: 'Fruits', servingSize: 1, unit: 'medium (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
  { id: 'f32', name: 'Apple (Medium)', category: 'Fruits', servingSize: 1, unit: 'medium (180g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { id: 'f33', name: 'Blueberries', category: 'Fruits', servingSize: 100, unit: 'g (1 cup)', calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  { id: 'f34', name: 'Strawberries', category: 'Fruits', servingSize: 100, unit: 'g', calories: 33, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { id: 'f35', name: 'Orange', category: 'Fruits', servingSize: 1, unit: 'medium (130g)', calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2 },
  { id: 'f36', name: 'Watermelon', category: 'Fruits', servingSize: 150, unit: 'g', calories: 45, protein: 0.9, carbs: 11.5, fat: 0.2 },

  // Vegetables
  { id: 'f37', name: 'Broccoli (Steamed)', category: 'Vegetables', servingSize: 100, unit: 'g', calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4 },
  { id: 'f38', name: 'Baby Spinach', category: 'Vegetables', servingSize: 50, unit: 'g (2 cups)', calories: 12, protein: 1.4, carbs: 1.8, fat: 0.2 },
  { id: 'f39', name: 'Cucumber Slices', category: 'Vegetables', servingSize: 100, unit: 'g', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { id: 'f40', name: 'Carrots (Raw)', category: 'Vegetables', servingSize: 100, unit: 'g', calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },

  // Common Meals & Snacks
  { id: 'f41', name: 'Protein Bar', category: 'Snacks', servingSize: 1, unit: 'bar (60g)', calories: 220, protein: 20, carbs: 22, fat: 7 },
  { id: 'f42', name: 'Rice Cakes (Plain)', category: 'Snacks', servingSize: 2, unit: 'cakes (18g)', calories: 70, protein: 1.4, carbs: 15, fat: 0.5 },
  { id: 'f43', name: 'Honey', category: 'Snacks', servingSize: 21, unit: 'g (1 tbsp)', calories: 64, protein: 0.1, carbs: 17.3, fat: 0 },
  { id: 'f44', name: 'Black Coffee / Espresso', category: 'Beverages', servingSize: 1, unit: 'cup (240ml)', calories: 3, protein: 0.3, carbs: 0, fat: 0 },
  { id: 'f45', name: 'Pre-Workout Drink', category: 'Supplements', servingSize: 1, unit: 'scoop (10g)', calories: 15, protein: 0, carbs: 3, fat: 0 }
];

window.FoodDatabase = {
  foods: [...DEFAULT_FOOD_DATABASE],
  
  init() {
    try {
      const customFoods = JSON.parse(localStorage.getItem('wolfpack_custom_foods') || '[]');
      this.foods = [...DEFAULT_FOOD_DATABASE, ...customFoods];
    } catch (e) {
      this.foods = [...DEFAULT_FOOD_DATABASE];
    }
  },

  getAll() {
    return this.foods;
  },

  search(query) {
    if (!query) return this.foods;
    const lower = query.toLowerCase().trim();
    return this.foods.filter(f => 
      f.name.toLowerCase().includes(lower) || 
      f.category.toLowerCase().includes(lower)
    );
  },

  getById(id) {
    return this.foods.find(f => f.id === id);
  },

  addCustomFood(food) {
    const newFood = {
      id: 'custom_' + Date.now(),
      name: food.name,
      category: food.category || 'Custom',
      servingSize: parseFloat(food.servingSize) || 100,
      unit: food.unit || 'g',
      calories: Math.round(parseFloat(food.calories) || 0),
      protein: Math.round((parseFloat(food.protein) || 0) * 10) / 10,
      carbs: Math.round((parseFloat(food.carbs) || 0) * 10) / 10,
      fat: Math.round((parseFloat(food.fat) || 0) * 10) / 10
    };

    try {
      const customFoods = JSON.parse(localStorage.getItem('wolfpack_custom_foods') || '[]');
      customFoods.push(newFood);
      localStorage.setItem('wolfpack_custom_foods', JSON.stringify(customFoods));
    } catch (e) {}

    this.foods.push(newFood);
    return newFood;
  },

  calculateForQuantity(food, quantity) {
    const qty = parseFloat(quantity) || 1;
    return {
      name: food.name,
      foodId: food.id,
      quantity: qty,
      unitDisplay: `${qty} x ${food.servingSize} ${food.unit}`,
      calories: Math.round(food.calories * qty),
      protein: Math.round(food.protein * qty * 10) / 10,
      carbs: Math.round(food.carbs * qty * 10) / 10,
      fat: Math.round(food.fat * qty * 10) / 10
    };
  }
};
