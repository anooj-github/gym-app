// Wolfpack Fitness Application Controller
window.WolfpackApp = {
  activeTab: 'dashboard',
  restTimerInterval: null,
  restTimerSecondsRemaining: 90,

  init() {
    // Initialize sub-modules
    window.FoodDatabase.init();
    window.WolfpackTracker.init();
    window.WolfpackCalendar.init();
    window.WolfpackCloudSync.init();

    this.setupEventListeners();
    this.setupDateNavigator();
    this.refreshAll();
    this.renderFoodDatabaseList();

    // Responsive window resize chart redraw
    window.addEventListener('resize', () => {
      if (this.activeTab === 'analytics' || this.activeTab === 'dashboard') {
        this.renderCharts();
      }
    });
  },

  setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });

    // Quick Add Modal Buttons
    const fabBtn = document.getElementById('quick-add-fab');
    if (fabBtn) fabBtn.addEventListener('click', () => this.openQuickAddModal());

    const headerQuickBtn = document.getElementById('header-quick-add-btn');
    if (headerQuickBtn) headerQuickBtn.addEventListener('click', () => this.openQuickAddModal());

    // Profile Settings Button
    const profileBtn = document.getElementById('header-profile-btn');
    if (profileBtn) profileBtn.addEventListener('click', () => this.openProfileModal());

    // Close modals when clicking overlay background
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Live search input for foods
    const foodSearchInput = document.getElementById('food-search-input');
    if (foodSearchInput) {
      foodSearchInput.addEventListener('input', (e) => {
        this.filterFoodDatabase(e.target.value);
      });
    }

    // Quick add food search input
    const qaFoodSearch = document.getElementById('qa-food-search');
    if (qaFoodSearch) {
      qaFoodSearch.addEventListener('input', (e) => {
        this.filterQuickAddFood(e.target.value);
      });
    }
  },

  setupDateNavigator() {
    this.updateDateDisplay();

    const prevBtn = document.getElementById('date-prev-btn');
    const nextBtn = document.getElementById('date-next-btn');
    const todayBtn = document.getElementById('date-today-btn');
    const dateInput = document.getElementById('date-picker-input');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const current = new Date(window.WolfpackTracker.selectedDate);
        current.setDate(current.getDate() - 1);
        window.WolfpackTracker.selectedDate = current;
        this.onDateChanged();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const current = new Date(window.WolfpackTracker.selectedDate);
        current.setDate(current.getDate() + 1);
        window.WolfpackTracker.selectedDate = current;
        this.onDateChanged();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        window.WolfpackTracker.selectedDate = new Date();
        this.onDateChanged();
      });
    }

    if (dateInput) {
      dateInput.addEventListener('change', (e) => {
        if (e.target.value) {
          window.WolfpackTracker.selectedDate = new Date(e.target.value + 'T00:00:00');
          this.onDateChanged();
        }
      });
    }
  },

  onDateChanged() {
    this.updateDateDisplay();
    this.refreshAll();
  },

  updateDateDisplay() {
    const selected = window.WolfpackTracker.selectedDate;
    const todayStr = window.WolfpackTracker.getTodayKey();
    const selectedStr = window.WolfpackTracker.getSelectedDateKey();

    const dateDisplay = document.getElementById('current-date-display');
    const dateInput = document.getElementById('date-picker-input');

    if (dateInput) {
      dateInput.value = selectedStr;
    }

    if (dateDisplay) {
      const isToday = selectedStr === todayStr;
      const formatted = selected.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      dateDisplay.innerHTML = `${formatted} ${isToday ? '<span class="today-tag">TODAY</span>' : ''}`;
    }
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-content-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });

    if (tabId === 'calendar') {
      window.WolfpackCalendar.render();
    } else if (tabId === 'analytics' || tabId === 'dashboard') {
      setTimeout(() => this.renderCharts(), 50);
    }
  },

  refreshAll() {
    this.renderDashboardMetrics();
    this.renderLoggedFoodsList();
    this.renderWorkoutsList();
    this.renderCharts();
  },

  renderDashboardMetrics() {
    const dayKey = window.WolfpackTracker.getSelectedDateKey();
    const day = window.WolfpackTracker.getDayData(dayKey);
    const profile = window.WolfpackTracker.userProfile;

    // 1. Gym Days & Streak
    const streak = window.WolfpackTracker.calculateCurrentStreak();
    const isGymToday = day.gymDay && day.gymDay.isGymDay;
    const gymStreakElem = document.getElementById('metric-gym-streak');
    const gymStatusBadge = document.getElementById('metric-gym-status-badge');
    const gymToggleBtn = document.getElementById('metric-gym-toggle-btn');

    if (gymStreakElem) gymStreakElem.textContent = `${streak} Days`;
    if (gymStatusBadge) {
      if (isGymToday) {
        const split = window.WolfpackCalendar.WORKOUT_SPLITS.find(s => s.id === day.gymDay.splitId) || { name: 'Gym Day', icon: '🔥' };
        gymStatusBadge.innerHTML = `<span class="badge-active">${split.icon} ${split.name}</span>`;
      } else {
        gymStatusBadge.innerHTML = `<span class="badge-inactive">Rest / Off</span>`;
      }
    }
    if (gymToggleBtn) {
      gymToggleBtn.innerHTML = isGymToday ? '✓ Checked In' : '+ Check In Today';
      gymToggleBtn.className = isGymToday ? 'btn-subtle-success' : 'btn-glow-primary';
    }

    // 2. Calories & Macros
    const totals = window.WolfpackTracker.getDayNutritionTotals(dayKey);
    const targetCals = profile.dailyCalorieTarget || 2300;
    const remainingCals = targetCals - totals.calories;
    const calsPercent = Math.min(100, Math.round((totals.calories / targetCals) * 100));

    const calConsumedElem = document.getElementById('metric-cals-consumed');
    const calTargetElem = document.getElementById('metric-cals-target');
    const calRemainingElem = document.getElementById('metric-cals-remaining');
    const calRingSvg = document.getElementById('metric-cals-progress-circle');

    if (calConsumedElem) calConsumedElem.textContent = totals.calories.toLocaleString();
    if (calTargetElem) calTargetElem.textContent = `/ ${targetCals.toLocaleString()} kcal`;
    if (calRemainingElem) {
      if (remainingCals >= 0) {
        calRemainingElem.innerHTML = `<span class="text-amber">${remainingCals.toLocaleString()}</span> kcal left`;
      } else {
        calRemainingElem.innerHTML = `<span class="text-rose">+${Math.abs(remainingCals).toLocaleString()}</span> kcal over`;
      }
    }

    // SVG Ring (circumference = 2 * PI * 42 = ~263.89)
    if (calRingSvg) {
      const radius = 42;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (calsPercent / 100) * circumference;
      calRingSvg.style.strokeDasharray = `${circumference}`;
      calRingSvg.style.strokeDashoffset = `${offset}`;
    }

    // Macros UI
    const macroProtein = document.getElementById('macro-protein-val');
    const macroCarbs = document.getElementById('macro-carbs-val');
    const macroFat = document.getElementById('macro-fat-val');

    if (macroProtein) macroProtein.textContent = `${totals.protein}g`;
    if (macroCarbs) macroCarbs.textContent = `${totals.carbs}g`;
    if (macroFat) macroFat.textContent = `${totals.fat}g`;

    // 3. Steps
    const steps = day.steps || 0;
    const stepTarget = profile.dailyStepTarget || 10000;
    const stepPct = Math.min(100, Math.round((steps / stepTarget) * 100));
    const distKm = (steps * 0.00075).toFixed(2);
    const burnedKcal = Math.round(steps * 0.04);

    const stepsValElem = document.getElementById('metric-steps-val');
    const stepsTargetElem = document.getElementById('metric-steps-target');
    const stepsDistElem = document.getElementById('metric-steps-distance');
    const stepsBurnedElem = document.getElementById('metric-steps-burned');
    const stepsBarElem = document.getElementById('metric-steps-bar-fill');

    if (stepsValElem) stepsValElem.textContent = steps.toLocaleString();
    if (stepsTargetElem) stepsTargetElem.textContent = `Goal: ${stepTarget.toLocaleString()}`;
    if (stepsDistElem) stepsDistElem.textContent = `${distKm} km`;
    if (stepsBurnedElem) stepsBurnedElem.textContent = `~${burnedKcal} kcal`;
    if (stepsBarElem) stepsBarElem.style.width = `${stepPct}%`;

    // 4. Weight & Auto-BMI
    const currentWeight = day.weight !== null ? day.weight : window.WolfpackTracker.getLatestWeight();
    const targetWeight = profile.targetWeightKg || 75.0;
    const weightDiff = (currentWeight - targetWeight).toFixed(1);

    const weightValElem = document.getElementById('metric-weight-val');
    const weightDiffElem = document.getElementById('metric-weight-diff');
    const weightStatusTag = document.getElementById('metric-weight-logged-tag');

    if (weightValElem) weightValElem.textContent = `${currentWeight.toFixed(1)} kg`;
    if (weightDiffElem) {
      if (Math.abs(weightDiff) < 0.1) {
        weightDiffElem.innerHTML = `<span class="text-emerald">🎯 At Goal (${targetWeight} kg)</span>`;
      } else if (weightDiff > 0) {
        weightDiffElem.innerHTML = `<span>${weightDiff} kg above target</span>`;
      } else {
        weightDiffElem.innerHTML = `<span>${Math.abs(weightDiff)} kg below target</span>`;
      }
    }
    if (weightStatusTag) {
      weightStatusTag.textContent = day.weight !== null ? '✓ Logged Today' : '⏳ Prior Weight';
      weightStatusTag.className = day.weight !== null ? 'status-tag success' : 'status-tag subtle';
    }

    // Auto-calculated BMI
    const bmiResult = window.WolfpackTracker.calculateBMI(currentWeight, profile.heightCm);
    const bmiValElem = document.getElementById('metric-bmi-val');
    const bmiCategoryElem = document.getElementById('metric-bmi-category');
    const bmiNeedle = document.getElementById('bmi-gauge-needle');

    if (bmiValElem) bmiValElem.textContent = bmiResult.bmi > 0 ? bmiResult.bmi : '--';
    if (bmiCategoryElem) {
      bmiCategoryElem.textContent = bmiResult.category;
      bmiCategoryElem.style.color = bmiResult.color;
    }
    if (bmiNeedle) {
      bmiNeedle.style.left = `${bmiResult.percentage}%`;
    }

    // 5. Water Tracker
    const waterVal = day.water || 0;
    const waterTarget = profile.dailyWaterTarget || 3000;
    const waterElem = document.getElementById('metric-water-val');
    const waterBar = document.getElementById('metric-water-bar');
    if (waterElem) waterElem.textContent = `${(waterVal / 1000).toFixed(2)}L / ${(waterTarget / 1000).toFixed(1)}L`;
    if (waterBar) waterBar.style.width = `${Math.min(100, Math.round((waterVal / waterTarget) * 100))}%`;
  },

  renderLoggedFoodsList() {
    const dayKey = window.WolfpackTracker.getSelectedDateKey();
    const day = window.WolfpackTracker.getDayData(dayKey);
    const container = document.getElementById('logged-meals-container');
    if (!container) return;

    const foods = day.foods || [];
    if (foods.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <span class="empty-icon">🥗</span>
          <p>No food logged for this day.</p>
          <button class="btn-subtle" onclick="window.WolfpackApp.openAddFoodModal()">+ Log Food / Meal</button>
        </div>
      `;
      return;
    }

    const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    let html = '';

    mealTypes.forEach(mType => {
      const mealItems = foods.filter(f => (f.mealType || 'Breakfast').toLowerCase() === mType.toLowerCase() || (mType === 'Snacks' && f.mealType === 'Snack'));
      if (mealItems.length > 0) {
        const mealCals = mealItems.reduce((s, item) => s + (item.calories || 0), 0);
        const mealProtein = Math.round(mealItems.reduce((s, item) => s + (item.protein || 0), 0) * 10) / 10;

        html += `
          <div class="meal-group-card">
            <div class="meal-group-header">
              <div class="meal-group-title">
                <span class="meal-icon">${mType === 'Breakfast' ? '🥞' : mType === 'Lunch' ? '🥗' : mType === 'Dinner' ? '🥩' : '🍎'}</span>
                <strong>${mType}</strong>
              </div>
              <div class="meal-group-meta">
                <span>${mealCals} kcal</span>
                <span class="meta-dot">•</span>
                <span class="text-cyan">${mealProtein}g P</span>
              </div>
            </div>
            <div class="meal-items-list">
              ${mealItems.map(item => `
                <div class="meal-item-row">
                  <div class="meal-item-info">
                    <span class="meal-item-name">${item.name}</span>
                    <span class="meal-item-serving">${item.unitDisplay || ''}</span>
                  </div>
                  <div class="meal-item-macros">
                    <span class="macro-pill cals">${item.calories} kcal</span>
                    <span class="macro-pill protein">${item.protein}g P</span>
                    <span class="macro-pill carbs">${item.carbs}g C</span>
                    <span class="macro-pill fat">${item.fat}g F</span>
                    <button class="btn-icon-delete" onclick="window.WolfpackApp.deleteFoodEntry('${item.id}')" title="Delete entry">✕</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    });

    container.innerHTML = html;
  },

  deleteFoodEntry(entryId) {
    const dayKey = window.WolfpackTracker.getSelectedDateKey();
    window.WolfpackTracker.removeFoodEntry(dayKey, entryId);
    this.refreshAll();
    this.showToast('Meal entry removed');
  },

  renderWorkoutsList() {
    const dayKey = window.WolfpackTracker.getSelectedDateKey();
    const day = window.WolfpackTracker.getDayData(dayKey);
    const container = document.getElementById('logged-workouts-container');
    const fullContainer = document.getElementById('workouts-full-list');

    const workouts = day.workouts || [];
    const emptyHtml = `
      <div class="empty-state-box">
        <span class="empty-icon">🏋️</span>
        <p>No workout sessions logged yet for this day.</p>
        <button class="btn-primary-action" style="margin: 0 auto;" onclick="window.WolfpackApp.openWorkoutBuilderModal()">+ Log Workout Session</button>
      </div>
    `;

    if (workouts.length === 0) {
      if (container) container.innerHTML = emptyHtml;
      if (fullContainer) fullContainer.innerHTML = emptyHtml;
      return;
    }

    let html = '';
    workouts.forEach(w => {
      html += `
        <div class="workout-session-card">
          <div class="workout-session-header">
            <div>
              <h4 class="workout-session-title">⚡ ${w.title}</h4>
              <span class="workout-session-time">⏱️ ${w.durationMinutes} minutes duration</span>
            </div>
          </div>
          <div class="workout-exercises-list">
            ${(w.exercises || []).map((ex, idx) => `
              <div class="workout-exercise-item">
                <div class="exercise-item-name"><strong>${idx + 1}. ${ex.name}</strong></div>
                <div class="exercise-sets-grid">
                  ${(ex.sets || []).map((s, sIdx) => `
                    <div class="set-chip">
                      <span class="set-num">S${sIdx + 1}</span>
                      <span class="set-data">${s.reps} reps @ ${s.weight} kg</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    if (container) container.innerHTML = html;
    if (fullContainer) fullContainer.innerHTML = html;
  },

  renderCharts() {
    const dailyData = window.WolfpackTracker.dailyData;
    const keys = Object.keys(dailyData).sort();
    const profile = window.WolfpackTracker.userProfile;

    // Build past 14 days weight series
    const weightData = [];
    const stepsData = [];
    const caloriesData = [];

    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = window.WolfpackTracker.formatDateKey(d);
      const day = dailyData[key] || { weight: null, steps: 0, foods: [] };

      // Weight
      if (day.weight) {
        weightData.push({
          date: key,
          label: d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
          weight: day.weight
        });
      }

      // Steps
      stepsData.push({
        date: key,
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        steps: day.steps || 0,
        isToday: i === 0
      });

      // Calories
      const totals = window.WolfpackTracker.getDayNutritionTotals(key);
      caloriesData.push({
        date: key,
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        calories: totals.calories
      });
    }

    window.WolfpackCharts.renderWeightChart('weight-trend-canvas', weightData, profile.targetWeightKg);
    window.WolfpackCharts.renderWeightChart('weight-trend-analytics-canvas', weightData, profile.targetWeightKg);
    window.WolfpackCharts.renderStepsChart('steps-trend-canvas', stepsData, profile.dailyStepTarget);
    window.WolfpackCharts.renderCaloriesChart('calories-trend-canvas', caloriesData, profile.dailyCalorieTarget);
  },

  // Food Library UI
  renderFoodDatabaseList(items = null) {
    const listContainer = document.getElementById('food-database-grid');
    if (!listContainer) return;

    const foods = items || window.FoodDatabase.getAll();
    listContainer.innerHTML = foods.map(f => `
      <div class="food-db-card" onclick="window.WolfpackApp.selectFoodForAdd('${f.id}')">
        <div class="food-db-head">
          <strong class="food-name">${f.name}</strong>
          <span class="category-tag">${f.category}</span>
        </div>
        <div class="food-db-serving">Serving: ${f.servingSize} ${f.unit}</div>
        <div class="food-db-macros">
          <span class="cal-badge">${f.calories} kcal</span>
          <span>${f.protein}g P</span>
          <span>${f.carbs}g C</span>
          <span>${f.fat}g F</span>
        </div>
      </div>
    `).join('');
  },

  filterFoodDatabase(query) {
    const results = window.FoodDatabase.search(query);
    this.renderFoodDatabaseList(results);
  },

  filterQuickAddFood(query) {
    const container = document.getElementById('qa-food-results');
    if (!container) return;

    if (!query || query.trim().length === 0) {
      container.innerHTML = '<div class="hint-text">Search 50+ fitness foods (e.g. Chicken, Oats, Eggs, Whey)...</div>';
      return;
    }

    const results = window.FoodDatabase.search(query);
    if (results.length === 0) {
      container.innerHTML = `
        <div class="empty-hint">
          No food found matching "${query}". 
          <button class="btn-link" onclick="window.WolfpackApp.openCustomFoodModal()">+ Create Custom Food</button>
        </div>
      `;
      return;
    }

    container.innerHTML = results.slice(0, 6).map(f => `
      <div class="qa-food-item-btn" onclick="window.WolfpackApp.quickLogSelectedFood('${f.id}')">
        <div class="qa-food-left">
          <strong>${f.name}</strong>
          <small>${f.servingSize} ${f.unit}</small>
        </div>
        <div class="qa-food-right">
          <span class="cals-val">${f.calories} kcal</span>
          <span class="prot-val">${f.protein}g P</span>
        </div>
      </div>
    `).join('');
  },

  selectFoodForAdd(foodId) {
    const food = window.FoodDatabase.getById(foodId);
    if (!food) return;

    const modal = document.getElementById('add-food-detail-modal');
    if (!modal) return;

    document.getElementById('add-food-title').textContent = food.name;
    document.getElementById('add-food-serving-label').textContent = `Serving Size: ${food.servingSize} ${food.unit}`;
    document.getElementById('add-food-qty-input').value = 1;
    document.getElementById('add-food-selected-id').value = food.id;
    this.updateFoodDetailCalc();

    modal.classList.add('active');
  },

  updateFoodDetailCalc() {
    const foodId = document.getElementById('add-food-selected-id').value;
    const qty = parseFloat(document.getElementById('add-food-qty-input').value) || 1;
    const food = window.FoodDatabase.getById(foodId);
    if (!food) return;

    const calc = window.FoodDatabase.calculateForQuantity(food, qty);
    document.getElementById('add-food-calc-cals').textContent = `${calc.calories} kcal`;
    document.getElementById('add-food-calc-protein').textContent = `${calc.protein}g P`;
    document.getElementById('add-food-calc-carbs').textContent = `${calc.carbs}g C`;
    document.getElementById('add-food-calc-fat').textContent = `${calc.fat}g F`;
  },

  saveFoodDetailToLog() {
    const foodId = document.getElementById('add-food-selected-id').value;
    const qty = parseFloat(document.getElementById('add-food-qty-input').value) || 1;
    const mealType = document.getElementById('add-food-meal-select').value;
    const food = window.FoodDatabase.getById(foodId);
    if (!food) return;

    const calc = window.FoodDatabase.calculateForQuantity(food, qty);
    const dayKey = window.WolfpackTracker.getSelectedDateKey();

    window.WolfpackTracker.addFoodEntry(dayKey, {
      name: food.name,
      foodId: food.id,
      mealType,
      unitDisplay: `${qty} x (${food.servingSize} ${food.unit})`,
      calories: calc.calories,
      protein: calc.protein,
      carbs: calc.carbs,
      fat: calc.fat
    });

    document.getElementById('add-food-detail-modal').classList.remove('active');
    this.refreshAll();
    this.showToast(`Logged ${calc.calories} kcal to ${mealType}! 🥗`);
  },

  quickLogSelectedFood(foodId) {
    const food = window.FoodDatabase.getById(foodId);
    if (!food) return;

    const mealType = document.getElementById('qa-meal-type-select')?.value || 'Breakfast';
    const dayKey = window.WolfpackTracker.getSelectedDateKey();

    window.WolfpackTracker.addFoodEntry(dayKey, {
      name: food.name,
      foodId: food.id,
      mealType,
      unitDisplay: `1 x (${food.servingSize} ${food.unit})`,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat
    });

    this.closeAllModals();
    this.refreshAll();
    this.showToast(`Logged ${food.name} (${food.calories} kcal)! 🥗`);
  },

  // Manual Quick Logs
  submitQuickWeight() {
    const input = document.getElementById('qa-weight-input');
    const val = parseFloat(input.value);
    if (!val || isNaN(val) || val <= 0) {
      this.showToast('Please enter a valid weight (e.g. 78.5)', 'warning');
      return;
    }

    const dayKey = window.WolfpackTracker.getSelectedDateKey();
    window.WolfpackTracker.logWeight(dayKey, val);
    this.closeAllModals();
    this.refreshAll();
    this.showToast(`Logged weight: ${val.toFixed(1)} kg! BMI updated ⚡`);
  },

  submitQuickSteps() {
    const input = document.getElementById('qa-steps-input');
    const val = parseInt(input.value, 10);
    if (isNaN(val) || val < 0) {
      this.showToast('Please enter a valid step count (e.g. 8500)', 'warning');
      return;
    }

    const dayKey = window.WolfpackTracker.getSelectedDateKey();
    window.WolfpackTracker.logSteps(dayKey, val);
    this.closeAllModals();
    this.refreshAll();
    this.showToast(`Logged ${val.toLocaleString()} steps! 👟`);
  },

  quickAddWater(amountMl) {
    const dayKey = window.WolfpackTracker.getSelectedDateKey();
    const newTotal = window.WolfpackTracker.logWater(dayKey, amountMl);
    this.refreshAll();
    this.showToast(`+${amountMl}ml logged! Total: ${(newTotal / 1000).toFixed(2)}L 💧`);
  },

  // Custom Food Modal
  openCustomFoodModal() {
    const modal = document.getElementById('custom-food-modal');
    if (modal) modal.classList.add('active');
  },

  saveCustomFood() {
    const name = document.getElementById('cf-name').value.trim();
    const calories = parseFloat(document.getElementById('cf-calories').value);
    const protein = parseFloat(document.getElementById('cf-protein').value) || 0;
    const carbs = parseFloat(document.getElementById('cf-carbs').value) || 0;
    const fat = parseFloat(document.getElementById('cf-fat').value) || 0;
    const servingSize = parseFloat(document.getElementById('cf-serving').value) || 100;
    const unit = document.getElementById('cf-unit').value.trim() || 'g';

    if (!name || isNaN(calories)) {
      this.showToast('Please fill in food name and calories', 'warning');
      return;
    }

    window.FoodDatabase.addCustomFood({
      name,
      category: 'Custom',
      servingSize,
      unit,
      calories,
      protein,
      carbs,
      fat
    });

    document.getElementById('custom-food-modal').classList.remove('active');
    this.renderFoodDatabaseList();
    this.showToast(`Added "${name}" to food database!`);
  },

  // Workout Builder
  openWorkoutBuilderModal() {
    const modal = document.getElementById('workout-builder-modal');
    if (!modal) return;
    this.resetWorkoutBuilder();
    modal.classList.add('active');
  },

  resetWorkoutBuilder() {
    const container = document.getElementById('wb-exercises-container');
    if (container) {
      container.innerHTML = '';
      this.addExerciseRowToBuilder('Barbell Bench Press', [{ reps: 10, weight: 60 }, { reps: 8, weight: 70 }]);
    }
  },

  addExerciseRowToBuilder(defaultName = '', defaultSets = [{ reps: 10, weight: 20 }]) {
    const container = document.getElementById('wb-exercises-container');
    if (!container) return;

    const exId = 'wb_ex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 3);
    const row = document.createElement('div');
    row.className = 'wb-exercise-block';
    row.id = exId;

    row.innerHTML = `
      <div class="wb-ex-header">
        <input type="text" class="wb-ex-name-input input-field" placeholder="Exercise Name (e.g. Squats, Deadlift, Pull-ups)" value="${defaultName}">
        <button type="button" class="btn-icon-delete" onclick="document.getElementById('${exId}').remove()" title="Remove exercise">✕</button>
      </div>
      <div class="wb-sets-table">
        <div class="wb-sets-header">
          <span>Set</span>
          <span>Reps</span>
          <span>Weight (kg)</span>
          <span></span>
        </div>
        <div class="wb-sets-body" id="${exId}_sets">
          ${defaultSets.map((s, idx) => `
            <div class="wb-set-row">
              <span class="set-idx">${idx + 1}</span>
              <input type="number" class="set-reps-input" value="${s.reps}" placeholder="10">
              <input type="number" step="0.5" class="set-weight-input" value="${s.weight}" placeholder="50">
              <button type="button" class="btn-del-set" onclick="this.closest('.wb-set-row').remove()">✕</button>
            </div>
          `).join('')}
        </div>
        <button type="button" class="btn-subtle btn-add-set" onclick="window.WolfpackApp.addSetRow('${exId}_sets')">+ Add Set</button>
      </div>
    `;

    container.appendChild(row);
  },

  addSetRow(setsContainerId) {
    const container = document.getElementById(setsContainerId);
    if (!container) return;
    const currentCount = container.querySelectorAll('.wb-set-row').length + 1;
    const div = document.createElement('div');
    div.className = 'wb-set-row';
    div.innerHTML = `
      <span class="set-idx">${currentCount}</span>
      <input type="number" class="set-reps-input" value="10" placeholder="10">
      <input type="number" step="0.5" class="set-weight-input" value="20" placeholder="50">
      <button type="button" class="btn-del-set" onclick="this.closest('.wb-set-row').remove()">✕</button>
    `;
    container.appendChild(div);
  },

  saveWorkoutBuilderSession() {
    const title = document.getElementById('wb-session-title').value.trim() || 'Gym Workout';
    const duration = parseInt(document.getElementById('wb-duration').value, 10) || 45;
    const exBlocks = document.querySelectorAll('.wb-exercise-block');

    const exercises = [];
    exBlocks.forEach(block => {
      const name = block.querySelector('.wb-ex-name-input').value.trim();
      if (!name) return;

      const setRows = block.querySelectorAll('.wb-set-row');
      const sets = [];
      setRows.forEach(row => {
        const reps = parseInt(row.querySelector('.set-reps-input').value, 10) || 0;
        const weight = parseFloat(row.querySelector('.set-weight-input').value) || 0;
        sets.push({ reps, weight });
      });

      exercises.push({ name, sets });
    });

    if (exercises.length === 0) {
      this.showToast('Please add at least one exercise', 'warning');
      return;
    }

    const dayKey = window.WolfpackTracker.getSelectedDateKey();
    window.WolfpackTracker.addWorkoutSession(dayKey, {
      title,
      durationMinutes: duration,
      exercises
    });

    document.getElementById('workout-builder-modal').classList.remove('active');
    this.refreshAll();
    window.WolfpackCalendar.render();
    this.showToast(`Logged workout: ${title}! 🔥`);
  },

  // Rest Timer
  startRestTimer(seconds = 90) {
    clearInterval(this.restTimerInterval);
    this.restTimerSecondsRemaining = seconds;
    const timerElem = document.getElementById('rest-timer-display');
    const timerBanner = document.getElementById('rest-timer-banner');

    if (timerBanner) timerBanner.classList.add('active');

    const updateDisplay = () => {
      const mins = Math.floor(this.restTimerSecondsRemaining / 60);
      const secs = this.restTimerSecondsRemaining % 60;
      if (timerElem) timerElem.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    };

    updateDisplay();

    this.restTimerInterval = setInterval(() => {
      this.restTimerSecondsRemaining--;
      if (this.restTimerSecondsRemaining <= 0) {
        clearInterval(this.restTimerInterval);
        updateDisplay();
        this.playTimerBeep();
        this.showToast('🔔 Rest time complete! Get after the next set!', 'success');
        if (timerBanner) timerBanner.classList.remove('active');
      } else {
        updateDisplay();
      }
    }, 1000);
  },

  stopRestTimer() {
    clearInterval(this.restTimerInterval);
    const timerBanner = document.getElementById('rest-timer-banner');
    if (timerBanner) timerBanner.classList.remove('active');
  },

  playTimerBeep() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  },

  // Profile Modal
  openProfileModal() {
    const profile = window.WolfpackTracker.userProfile;
    document.getElementById('prof-name').value = profile.name || 'Pack Leader';
    document.getElementById('prof-height').value = profile.heightCm || 172;
    document.getElementById('prof-target-weight').value = profile.targetWeightKg || 74.0;
    document.getElementById('prof-cal-target').value = profile.dailyCalorieTarget || 2300;
    document.getElementById('prof-step-target').value = profile.dailyStepTarget || 10000;
    document.getElementById('prof-gym-target').value = profile.monthlyGymTarget || 30;
    const streakInput = document.getElementById('prof-gym-streak');
    if (streakInput) streakInput.value = profile.gymStreak !== undefined ? profile.gymStreak : 30;

    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.add('active');
  },

  saveProfileSettings() {
    const profile = window.WolfpackTracker.userProfile;
    profile.name = document.getElementById('prof-name').value.trim() || 'Pack Leader';
    profile.heightCm = parseFloat(document.getElementById('prof-height').value) || 172;
    profile.targetWeightKg = parseFloat(document.getElementById('prof-target-weight').value) || 74.0;
    profile.dailyCalorieTarget = parseInt(document.getElementById('prof-cal-target').value, 10) || 2300;
    profile.dailyStepTarget = parseInt(document.getElementById('prof-step-target').value, 10) || 10000;
    profile.monthlyGymTarget = parseInt(document.getElementById('prof-gym-target').value, 10) || 30;
    const streakInput = document.getElementById('prof-gym-streak');
    if (streakInput) profile.gymStreak = parseInt(streakInput.value, 10) || 30;

    window.WolfpackTracker.saveState();
    document.getElementById('profile-modal').classList.remove('active');
    this.refreshAll();
    window.WolfpackCalendar.render();
    this.showToast('Profile & fitness targets saved!');
  },

  exportDataBackup() {
    const exportObj = {
      profile: window.WolfpackTracker.userProfile,
      dailyData: window.WolfpackTracker.dailyData,
      customFoods: JSON.parse(localStorage.getItem('wolfpack_custom_foods') || '[]'),
      exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `wolfpack_fitness_backup_${window.WolfpackTracker.getTodayKey()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast('Fitness data exported successfully!');
  },

  importDataBackup(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.profile && imported.dailyData) {
          window.WolfpackTracker.userProfile = imported.profile;
          window.WolfpackTracker.dailyData = imported.dailyData;
          if (imported.customFoods) {
            localStorage.setItem('wolfpack_custom_foods', JSON.stringify(imported.customFoods));
          }
          window.WolfpackTracker.saveState();
          window.FoodDatabase.init();
          this.refreshAll();
          window.WolfpackCalendar.render();
          this.closeAllModals();
          this.showToast('Data backup restored successfully!');
        } else {
          this.showToast('Invalid backup file format', 'warning');
        }
      } catch (err) {
        this.showToast('Failed to parse backup JSON file', 'warning');
      }
    };
    reader.readAsText(file);
  },

  resetAllData() {
    if (confirm('Are you sure you want to reset all Wolfpack data? This will restore sample defaults.')) {
      localStorage.removeItem('wolfpack_profile');
      localStorage.removeItem('wolfpack_daily_data');
      localStorage.removeItem('wolfpack_custom_foods');
      window.WolfpackTracker.init();
      window.FoodDatabase.init();
      window.WolfpackCalendar.init();
      this.refreshAll();
      this.closeAllModals();
      this.showToast('All fitness data reset to defaults.');
    }
  },

  openQuickAddModal() {
    const modal = document.getElementById('quick-add-modal');
    if (modal) modal.classList.add('active');
  },

  openAddFoodModal() {
    this.switchTab('nutrition');
    const search = document.getElementById('food-search-input');
    if (search) search.focus();
  },

  openCloudSyncModal() {
    const input = document.getElementById('cloud-script-url');
    if (input) input.value = window.WolfpackCloudSync.getScriptUrl();
    const modal = document.getElementById('cloud-sync-modal');
    if (modal) modal.classList.add('active');
  },

  async saveCloudScriptUrl() {
    const input = document.getElementById('cloud-script-url');
    const url = input ? input.value.trim() : '';
    if (!url) {
      this.showToast('Please enter a valid Google Apps Script Web App URL', 'warning');
      return;
    }

    window.WolfpackCloudSync.setScriptUrl(url);
    this.showToast('Google Apps Script URL saved! Testing connection...');
    try {
      await window.WolfpackCloudSync.testConnection(url);
      this.showToast('🟢 Connected to Google Sheets Cloud successfully!');
      // Initial sync
      window.WolfpackCloudSync.syncToCloud(true);
    } catch (e) {
      this.showToast('Saved, but test failed: ' + e.message, 'warning');
    }
  },

  async testCloudConnection() {
    const input = document.getElementById('cloud-script-url');
    const url = input ? input.value.trim() : '';
    try {
      await window.WolfpackCloudSync.testConnection(url);
      this.showToast('⚡ Connection verified! Google Sheets backend is online.');
    } catch (e) {
      this.showToast('Connection failed: ' + e.message, 'warning');
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  },

  showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'warning' ? '⚠️' : '⚡'}</span>
      <span class="toast-text">${message}</span>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.WolfpackApp.init();
});
