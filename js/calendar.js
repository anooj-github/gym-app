// Wolfpack Interactive Gym Calendar Module
window.WolfpackCalendar = {
  currentYear: new Date().getFullYear(),
  currentMonth: new Date().getMonth(), // 0-indexed (0 = Jan, 11 = Dec)
  selectedDateStr: null,

  WORKOUT_SPLITS: [
    { id: 'push', name: 'Push (Chest/Shoulders/Tris)', color: '#f59e0b', icon: '🔥' },
    { id: 'pull', name: 'Pull (Back/Biceps/Rear Delts)', color: '#00f0ff', icon: '⚡' },
    { id: 'legs', name: 'Legs & Core', color: '#10b981', icon: '🦵' },
    { id: 'full', name: 'Full Body', color: '#a855f7', icon: '⚔️' },
    { id: 'cardio', name: 'Cardio / HIIT / Run', color: '#ec4899', icon: '🏃' },
    { id: 'upper', name: 'Upper Body Power', color: '#3b82f6', icon: '💪' },
    { id: 'lower', name: 'Lower Body Strength', color: '#14b8a6', icon: '🏋️' },
    { id: 'rest', name: 'Active Recovery / Rest', color: '#64748b', icon: '🧘' }
  ],

  init() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.selectedDateStr = window.WolfpackTracker.formatDateKey(today);
    this.render();
  },

  setMonth(delta) {
    this.currentMonth += delta;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear -= 1;
    } else if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear += 1;
    }
    this.render();
  },

  goToToday() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.selectedDateStr = window.WolfpackTracker.formatDateKey(today);
    this.render();
  },

  getMonthName(monthIndex) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  },

  render() {
    const container = document.getElementById('calendar-days-grid');
    const headerTitle = document.getElementById('calendar-month-year');
    if (!container || !headerTitle) return;

    headerTitle.textContent = `${this.getMonthName(this.currentMonth)} ${this.currentYear}`;

    // Calculate month metrics
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();

    const todayStr = window.WolfpackTracker.formatDateKey(new Date());
    const gymDaysMap = window.WolfpackTracker.getGymDaysMap();

    // Calculate monthly stats
    let monthlyGymDaysCount = 0;
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (gymDaysMap[dStr] && gymDaysMap[dStr].isGymDay) {
        monthlyGymDaysCount++;
      }
    }

    const monthTarget = window.WolfpackTracker.userProfile.monthlyGymTarget || 20;
    const consistencyPct = Math.min(100, Math.round((monthlyGymDaysCount / monthTarget) * 100));

    // Update Calendar Stats UI
    const statMonthlyCount = document.getElementById('cal-stat-monthly-count');
    const statMonthlyTarget = document.getElementById('cal-stat-monthly-target');
    const statConsistency = document.getElementById('cal-stat-consistency');
    const statStreak = document.getElementById('cal-stat-streak');

    if (statMonthlyCount) statMonthlyCount.textContent = monthlyGymDaysCount;
    if (statMonthlyTarget) statMonthlyTarget.textContent = `${monthTarget} Days Target`;
    if (statConsistency) statConsistency.textContent = `${consistencyPct}%`;
    if (statStreak) statStreak.textContent = `${window.WolfpackTracker.calculateCurrentStreak()} Days 🔥`;

    let html = '';

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      html += `<div class="cal-day other-month"><span class="cal-day-num">${prevDay}</span></div>`;
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === this.selectedDateStr;
      const dayData = gymDaysMap[dateStr];
      const isGymDay = dayData && dayData.isGymDay;
      const split = isGymDay ? this.WORKOUT_SPLITS.find(s => s.id === dayData.splitId) || this.WORKOUT_SPLITS[0] : null;

      let gymBadge = '';
      if (isGymDay && split) {
        gymBadge = `
          <div class="gym-badge" style="background: ${split.color}22; border-color: ${split.color}; color: ${split.color}">
            <span class="gym-badge-icon">${split.icon}</span>
            <span class="gym-badge-text">${split.name.split(' ')[0]}</span>
          </div>
        `;
      }

      html += `
        <div class="cal-day current-month ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${isGymDay ? 'is-gym-day' : ''}"
             data-date="${dateStr}"
             onclick="window.WolfpackCalendar.onDayClick('${dateStr}')">
          <div class="cal-day-header">
            <span class="cal-day-num">${day}</span>
            ${isToday ? '<span class="today-dot">TODAY</span>' : ''}
            ${isGymDay ? '<span class="gym-fire-indicator">⚡</span>' : ''}
          </div>
          <div class="cal-day-content">
            ${gymBadge}
          </div>
        </div>
      `;
    }

    // Next month padding days to fill complete grid
    const totalSlots = firstDayIndex + totalDaysInMonth;
    const remainingSlots = (7 - (totalSlots % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      html += `<div class="cal-day other-month"><span class="cal-day-num">${i}</span></div>`;
    }

    container.innerHTML = html;
  },

  onDayClick(dateStr) {
    this.selectedDateStr = dateStr;
    this.render();
    this.openDayDetailsModal(dateStr);
  },

  openDayDetailsModal(dateStr) {
    const gymDaysMap = window.WolfpackTracker.getGymDaysMap();
    const dayData = gymDaysMap[dateStr] || { isGymDay: false, splitId: 'push', notes: '' };
    const dateObj = new Date(dateStr + 'T00:00:00');
    const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    const modal = document.getElementById('calendar-day-modal');
    if (!modal) return;

    document.getElementById('cal-modal-date-title').textContent = formattedDate;
    document.getElementById('cal-modal-is-gym-checkbox').checked = dayData.isGymDay;
    
    // Render split options
    const splitOptionsContainer = document.getElementById('cal-modal-split-options');
    if (splitOptionsContainer) {
      splitOptionsContainer.innerHTML = this.WORKOUT_SPLITS.map(split => `
        <label class="split-radio-card ${dayData.splitId === split.id ? 'active' : ''}" style="--accent-col: ${split.color}">
          <input type="radio" name="workoutSplit" value="${split.id}" ${dayData.splitId === split.id ? 'checked' : ''} onchange="window.WolfpackCalendar.onSplitChange(this)">
          <span class="split-icon">${split.icon}</span>
          <span class="split-label">${split.name}</span>
        </label>
      `).join('');
    }

    document.getElementById('cal-modal-notes').value = dayData.notes || '';
    
    // Toggle split container visibility based on gym check
    const splitSection = document.getElementById('cal-modal-split-section');
    if (splitSection) {
      splitSection.style.display = dayData.isGymDay ? 'block' : 'none';
    }

    modal.classList.add('active');
  },

  onSplitChange(input) {
    document.querySelectorAll('.split-radio-card').forEach(card => card.classList.remove('active'));
    input.closest('.split-radio-card').classList.add('active');
  },

  onToggleGymCheckbox(checkbox) {
    const splitSection = document.getElementById('cal-modal-split-section');
    if (splitSection) {
      splitSection.style.display = checkbox.checked ? 'block' : 'none';
    }
  },

  saveDayDetails() {
    if (!this.selectedDateStr) return;

    const isGymDay = document.getElementById('cal-modal-is-gym-checkbox').checked;
    const selectedSplit = document.querySelector('input[name="workoutSplit"]:checked')?.value || 'push';
    const notes = document.getElementById('cal-modal-notes').value.trim();

    window.WolfpackTracker.setGymDay(this.selectedDateStr, {
      isGymDay,
      splitId: selectedSplit,
      notes
    });

    this.closeModal();
    this.render();
    window.WolfpackApp.refreshAll();
    window.WolfpackApp.showToast(isGymDay ? 'Gym Day logged! Keep the fire burning 🔥' : 'Calendar updated.');
  },

  quickToggleTodayGym() {
    const todayStr = window.WolfpackTracker.formatDateKey(new Date());
    const gymDaysMap = window.WolfpackTracker.getGymDaysMap();
    const current = gymDaysMap[todayStr]?.isGymDay || false;

    window.WolfpackTracker.setGymDay(todayStr, {
      isGymDay: !current,
      splitId: gymDaysMap[todayStr]?.splitId || 'push',
      notes: gymDaysMap[todayStr]?.notes || ''
    });

    this.render();
    window.WolfpackApp.refreshAll();
    window.WolfpackApp.showToast(!current ? 'Marked today as Gym Day! 💪' : 'Gym status unchecked.');
  },

  closeModal() {
    const modal = document.getElementById('calendar-day-modal');
    if (modal) modal.classList.remove('active');
  }
};
