// Wolfpack Tracker: Core Metrics, Auto-BMI, Nutrition & State Store
window.WolfpackTracker = {
  selectedDate: new Date(),

  defaultProfile: {
    name: 'Pack Leader',
    heightCm: 172,
    targetWeightKg: 74.0,
    dailyCalorieTarget: 2300,
    dailyStepTarget: 10000,
    monthlyGymTarget: 30,
    gymStreak: 30,
    dailyWaterTarget: 3000,
    unitSystem: 'metric' // 'metric' (kg/cm) or 'imperial' (lbs/in)
  },

  userProfile: {},
  dailyData: {}, // Keyed by YYYY-MM-DD

  init() {
    this.loadState();
    
    // Ensure active profile matches requested user data
    this.userProfile.heightCm = 172;
    this.userProfile.targetWeightKg = 74.0;
    this.userProfile.monthlyGymTarget = 30;
    this.userProfile.gymStreak = parseInt(this.userProfile.gymStreak, 10) || 30;
    
    const today = new Date();
    const splits = ['push', 'pull', 'legs', 'upper', 'lower', 'full', 'push'];

    // Ensure 30 consecutive gym days exist in data
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = this.formatDateKey(d);

      if (!this.dailyData[key]) {
        this.dailyData[key] = {
          weight: 74.0,
          steps: 0,
          water: 0,
          foods: [],
          gymDay: { isGymDay: true, splitId: splits[i % splits.length], notes: 'Gym Training Day' },
          workouts: []
        };
      } else {
        if (!this.dailyData[key].gymDay) {
          this.dailyData[key].gymDay = { isGymDay: true, splitId: splits[i % splits.length], notes: 'Gym Training Day' };
        }
        this.dailyData[key].gymDay.isGymDay = true;
      }
    }
    
    // Explicitly reset current day's steps to 0 and calorie intake to 0 as requested
    const todayKey = this.getTodayKey();
    const todayData = this.getDayData(todayKey);
    todayData.weight = 74.0;
    todayData.steps = 0;
    todayData.foods = [];
    todayData.gymDay.isGymDay = true;
    this.saveState();
  },

  formatDateKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getTodayKey() {
    return this.formatDateKey(new Date());
  },

  getSelectedDateKey() {
    return this.formatDateKey(this.selectedDate);
  },

  loadState() {
    try {
      const savedProfile = localStorage.getItem('wolfpack_profile');
      this.userProfile = savedProfile ? JSON.parse(savedProfile) : { ...this.defaultProfile };

      const savedData = localStorage.getItem('wolfpack_daily_data');
      this.dailyData = savedData ? JSON.parse(savedData) : {};
    } catch (e) {
      console.error('Error loading Wolfpack state from localStorage:', e);
      this.userProfile = { ...this.defaultProfile };
      this.dailyData = {};
    }
  },

  saveState() {
    try {
      localStorage.setItem('wolfpack_profile', JSON.stringify(this.userProfile));
      localStorage.setItem('wolfpack_daily_data', JSON.stringify(this.dailyData));
      if (window.WolfpackCloudSync) {
        window.WolfpackCloudSync.triggerAutoSync();
      }
    } catch (e) {
      console.error('Error saving Wolfpack state:', e);
    }
  },

  getDayData(dateKey = null) {
    const key = dateKey || this.getSelectedDateKey();
    if (!this.dailyData[key]) {
      this.dailyData[key] = {
        weight: null,
        steps: 0,
        water: 0,
        foods: [],
        gymDay: { isGymDay: false, splitId: 'push', notes: '' },
        workouts: []
      };
    }
    return this.dailyData[key];
  },

  // BMI Calculation
  calculateBMI(weightKg = null, heightCm = null) {
    const weight = weightKg !== null ? parseFloat(weightKg) : this.getLatestWeight();
    const height = (heightCm !== null ? parseFloat(heightCm) : this.userProfile.heightCm) / 100; // to meters

    if (!weight || !height || height <= 0) {
      return { bmi: 0, category: 'Enter Weight & Height', color: '#64748b', percentage: 0 };
    }

    const bmi = parseFloat((weight / (height * height)).toFixed(1));
    let category = 'Normal';
    let color = '#10b981'; // green

    if (bmi < 18.5) {
      category = 'Underweight';
      color = '#38bdf8'; // blue
    } else if (bmi >= 18.5 && bmi < 25.0) {
      category = 'Normal / Healthy';
      color = '#10b981'; // green
    } else if (bmi >= 25.0 && bmi < 30.0) {
      category = 'Overweight / Muscular';
      color = '#f59e0b'; // amber
    } else {
      category = 'Obese';
      color = '#f43f5e'; // rose
    }

    // Needle percentage mapped between BMI 15 (0%) and 35 (100%)
    const minBMI = 15;
    const maxBMI = 35;
    const clamped = Math.max(minBMI, Math.min(maxBMI, bmi));
    const percentage = Math.round(((clamped - minBMI) / (maxBMI - minBMI)) * 100);

    return { bmi, category, color, percentage };
  },

  getLatestWeight() {
    const todayKey = this.getSelectedDateKey();
    if (this.dailyData[todayKey] && this.dailyData[todayKey].weight) {
      return this.dailyData[todayKey].weight;
    }

    // Look back through previous dates
    const keys = Object.keys(this.dailyData).sort().reverse();
    for (const k of keys) {
      if (this.dailyData[k] && this.dailyData[k].weight) {
        return this.dailyData[k].weight;
      }
    }
    return 74.0; // default starter weight
  },

  logWeight(dateKey, weightValue) {
    const key = dateKey || this.getSelectedDateKey();
    const day = this.getDayData(key);
    day.weight = parseFloat(parseFloat(weightValue).toFixed(1));
    this.saveState();
  },

  logSteps(dateKey, stepsValue) {
    const key = dateKey || this.getSelectedDateKey();
    const day = this.getDayData(key);
    day.steps = Math.max(0, parseInt(stepsValue, 10) || 0);
    this.saveState();
  },

  logWater(dateKey, deltaMl) {
    const key = dateKey || this.getSelectedDateKey();
    const day = this.getDayData(key);
    day.water = Math.max(0, (day.water || 0) + deltaMl);
    this.saveState();
    return day.water;
  },

  setGymDay(dateKey, gymDayObj) {
    const key = dateKey || this.getSelectedDateKey();
    const day = this.getDayData(key);
    day.gymDay = {
      isGymDay: Boolean(gymDayObj.isGymDay),
      splitId: gymDayObj.splitId || 'push',
      notes: gymDayObj.notes || ''
    };
    this.saveState();
  },

  getGymDaysMap() {
    const map = {};
    Object.keys(this.dailyData).forEach(key => {
      if (this.dailyData[key] && this.dailyData[key].gymDay) {
        map[key] = this.dailyData[key].gymDay;
      }
    });
    return map;
  },

  calculateCurrentStreak() {
    const today = new Date();
    let streak = 0;
    let checkDate = new Date(today);

    // Check if today is a gym day or rest day
    const todayKey = this.formatDateKey(today);
    const todayGym = this.dailyData[todayKey]?.gymDay?.isGymDay;

    if (!todayGym) {
      // Check yesterday to see if active streak was maintained
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const key = this.formatDateKey(checkDate);
      if (this.dailyData[key]?.gymDay?.isGymDay) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return Math.max(streak, parseInt(this.userProfile.gymStreak, 10) || 30);
  },

  // Nutrition Logs
  addFoodEntry(dateKey, foodEntry) {
    const key = dateKey || this.getSelectedDateKey();
    const day = this.getDayData(key);
    if (!day.foods) day.foods = [];

    const newEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      mealType: foodEntry.mealType || 'Breakfast', // Breakfast, Lunch, Dinner, Snack
      name: foodEntry.name,
      foodId: foodEntry.foodId || null,
      unitDisplay: foodEntry.unitDisplay || '1 serving',
      calories: Math.round(parseFloat(foodEntry.calories) || 0),
      protein: Math.round((parseFloat(foodEntry.protein) || 0) * 10) / 10,
      carbs: Math.round((parseFloat(foodEntry.carbs) || 0) * 10) / 10,
      fat: Math.round((parseFloat(foodEntry.fat) || 0) * 10) / 10,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    day.foods.push(newEntry);
    this.saveState();
    return newEntry;
  },

  removeFoodEntry(dateKey, entryId) {
    const key = dateKey || this.getSelectedDateKey();
    const day = this.getDayData(key);
    if (day.foods) {
      day.foods = day.foods.filter(f => f.id !== entryId);
      this.saveState();
    }
  },

  getDayNutritionTotals(dateKey = null) {
    const day = this.getDayData(dateKey);
    const foods = day.foods || [];

    const totals = foods.reduce((acc, f) => {
      acc.calories += f.calories || 0;
      acc.protein += f.protein || 0;
      acc.carbs += f.carbs || 0;
      acc.fat += f.fat || 0;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    totals.protein = Math.round(totals.protein * 10) / 10;
    totals.carbs = Math.round(totals.carbs * 10) / 10;
    totals.fat = Math.round(totals.fat * 10) / 10;

    return totals;
  },

  // Workouts
  addWorkoutSession(dateKey, workoutSession) {
    const key = dateKey || this.getSelectedDateKey();
    const day = this.getDayData(key);
    if (!day.workouts) day.workouts = [];

    const session = {
      id: 'wo_' + Date.now(),
      title: workoutSession.title || 'Workout Session',
      durationMinutes: workoutSession.durationMinutes || 45,
      exercises: workoutSession.exercises || []
    };

    day.workouts.push(session);
    day.gymDay.isGymDay = true;
    this.saveState();
    return session;
  },

  // Seed sample initial history (30 gym days count, 74kg weight)
  seedInitialDemoData() {
    const today = new Date();
    const splits = ['push', 'pull', 'legs', 'upper', 'lower', 'full', 'push'];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = this.formatDateKey(d);

      const isGym = true; // 30 Gym days count
      const isToday = i === 0;

      this.dailyData[key] = {
        weight: isToday ? 74.0 : parseFloat((74.0 + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        steps: isToday ? 0 : Math.floor(7500 + Math.random() * 5000),
        water: isToday ? 0 : 2500 + Math.floor(Math.random() * 500),
        gymDay: {
          isGymDay: true,
          splitId: splits[i % splits.length],
          notes: 'High energy workout session'
        },
        foods: isToday ? [] : [
          { mealType: 'Breakfast', name: 'Eggs, Toast & Coffee', calories: 450, protein: 28, carbs: 38, fat: 18 },
          { mealType: 'Lunch', name: 'Chicken & Rice Bowl', calories: 680, protein: 50, carbs: 75, fat: 14 },
          { mealType: 'Dinner', name: 'Steak & Salad', calories: 550, protein: 45, carbs: 15, fat: 28 }
        ],
        workouts: isGym ? [{
          id: 'wo_demo_' + i,
          title: splits[i % splits.length].toUpperCase() + ' Routine',
          durationMinutes: 50,
          exercises: [
            { name: 'Barbell Bench Press', sets: [{ reps: 8, weight: 80 }, { reps: 8, weight: 85 }] }
          ]
        }] : []
      };
    }

    this.saveState();
  }
};
