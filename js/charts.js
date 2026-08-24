// Wolfpack High-Performance Canvas Charts (Zero-Dependency)
window.WolfpackCharts = {
  // Render Weight Line Chart with glowing gradient & hoverable data points
  renderWeightChart(canvasId, dataPoints, targetWeight = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Support Retina Displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    if (!dataPoints || dataPoints.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No weight records yet. Log daily weight to view trend.', width / 2, height / 2);
      return;
    }

    const padding = { top: 25, right: 30, bottom: 35, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const weights = dataPoints.map(d => d.weight);
    let minWeight = Math.min(...weights, targetWeight || weights[0]);
    let maxWeight = Math.max(...weights, targetWeight || weights[0]);
    
    // Add small buffer
    const range = (maxWeight - minWeight) || 2;
    minWeight = Math.floor(minWeight - range * 0.15);
    maxWeight = Math.ceil(maxWeight + range * 0.15);

    // Draw horizontal grid lines & labels
    const gridCount = 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.lineWidth = 1;

    for (let i = 0; i <= gridCount; i++) {
      const yVal = minWeight + (i / gridCount) * (maxWeight - minWeight);
      const yPos = padding.top + chartH - (i / gridCount) * chartH;

      ctx.beginPath();
      ctx.moveTo(padding.left, yPos);
      ctx.lineTo(width - padding.right, yPos);
      ctx.stroke();

      ctx.fillText(`${yVal.toFixed(1)}kg`, padding.left - 8, yPos + 4);
    }

    // Draw Target Weight Line if available
    if (targetWeight && targetWeight >= minWeight && targetWeight <= maxWeight) {
      const targetY = padding.top + chartH - ((targetWeight - minWeight) / (maxWeight - minWeight)) * chartH;
      ctx.save();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, targetY);
      ctx.lineTo(width - padding.right, targetY);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'left';
      ctx.fillText(`Target (${targetWeight}kg)`, padding.left + 5, targetY - 5);
      ctx.restore();
    }

    // Calculate X, Y for points
    const stepX = dataPoints.length > 1 ? chartW / (dataPoints.length - 1) : chartW / 2;
    const points = dataPoints.map((dp, idx) => {
      const x = dataPoints.length > 1 ? padding.left + idx * stepX : padding.left + chartW / 2;
      const y = padding.top + chartH - ((dp.weight - minWeight) / (maxWeight - minWeight)) * chartH;
      return { x, y, ...dp };
    });

    // Draw Gradient Area below line
    if (points.length > 1) {
      const grad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i - 1].x) / 2;
        const yc = (points[i].y + points[i - 1].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
      ctx.lineTo(points[0].x, height - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Draw Main Line
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 10;

    if (points.length === 1) {
      ctx.arc(points[0].x, points[0].y, 4, 0, Math.PI * 2);
    } else {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[i - 1].x) / 2;
        const yc = (points[i].y + points[i - 1].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
    }
    ctx.restore();

    // Draw Points & X-Axis labels
    points.forEach((p, idx) => {
      // Outer glow circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#0b0f17';
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Show dates selectively
      const total = points.length;
      if (idx === 0 || idx === total - 1 || idx % Math.ceil(total / 6) === 0) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.label || p.date.slice(5), p.x, height - padding.bottom + 18);
      }
    });
  },

  // Render Daily Steps Bar Chart
  renderStepsChart(canvasId, dailySteps, stepGoal = 10000) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    if (!dailySteps || dailySteps.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No step records yet.', width / 2, height / 2);
      return;
    }

    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxSteps = Math.max(stepGoal * 1.2, ...dailySteps.map(d => d.steps));
    const barCount = dailySteps.length;
    const slotWidth = chartW / barCount;
    const barWidth = Math.max(8, Math.min(28, slotWidth * 0.55));

    // Goal line
    const goalY = padding.top + chartH - (stepGoal / maxSteps) * chartH;
    ctx.save();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, goalY);
    ctx.lineTo(width - padding.right, goalY);
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Goal (${stepGoal.toLocaleString()})`, padding.left + 5, goalY - 4);
    ctx.restore();

    // Render bars
    dailySteps.forEach((item, i) => {
      const x = padding.left + i * slotWidth + (slotWidth - barWidth) / 2;
      const barHeight = Math.max(4, (item.steps / maxSteps) * chartH);
      const y = padding.top + chartH - barHeight;
      const reachedGoal = item.steps >= stepGoal;

      // Rounded bar top
      const radius = 4;
      ctx.save();
      const grad = ctx.createLinearGradient(0, y, 0, padding.top + chartH);
      if (reachedGoal) {
        grad.addColorStop(0, '#10b981');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
        ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
        ctx.shadowBlur = 6;
      } else {
        grad.addColorStop(0, '#38bdf8');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0.2)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
      ctx.fill();
      ctx.restore();

      // Label
      ctx.fillStyle = item.isToday ? '#00f0ff' : '#94a3b8';
      ctx.font = item.isToday ? 'bold 10px Inter, sans-serif' : '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, height - 10);
    });
  },

  // Render Calories Intake vs Target Chart
  renderCaloriesChart(canvasId, dailyCalories, targetCalories = 2200) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    if (!dailyCalories || dailyCalories.length === 0) return;

    const padding = { top: 20, right: 20, bottom: 30, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxCals = Math.max(targetCalories * 1.3, ...dailyCalories.map(d => d.calories || 0));
    const slotWidth = chartW / dailyCalories.length;
    const barWidth = Math.max(8, Math.min(26, slotWidth * 0.55));

    // Target Calorie Line
    const targetY = padding.top + chartH - (targetCalories / maxCals) * chartH;
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, targetY);
    ctx.lineTo(width - padding.right, targetY);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Target (${targetCalories} kcal)`, padding.left + 5, targetY - 4);
    ctx.restore();

    dailyCalories.forEach((item, i) => {
      const x = padding.left + i * slotWidth + (slotWidth - barWidth) / 2;
      const barHeight = Math.max(4, ((item.calories || 0) / maxCals) * chartH);
      const y = padding.top + chartH - barHeight;
      const overTarget = item.calories > targetCalories;

      ctx.save();
      const grad = ctx.createLinearGradient(0, y, 0, padding.top + chartH);
      if (overTarget) {
        grad.addColorStop(0, '#f43f5e');
        grad.addColorStop(1, 'rgba(244, 63, 94, 0.2)');
      } else {
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(1, 'rgba(245, 158, 11, 0.2)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();
      ctx.restore();

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, height - 10);
    });
  }
};
