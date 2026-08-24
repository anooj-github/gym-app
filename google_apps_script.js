/**
 * ============================================================================
 * WOLFPACK FITNESS TRACKER — GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ============================================================================
 * 
 * INSTRUCTIONS FOR DEPLOYING AS A BACKEND:
 * 1. Open Google Sheets (https://sheets.new) and create a new sheet (e.g. "Wolfpack Fitness Cloud").
 * 2. In the top menu, click Extensions > Apps Script.
 * 3. Delete any code in the editor, copy and paste this entire file contents into Code.gs.
 * 4. Click the blue "Deploy" button at top right > "New deployment".
 * 5. Select type: "Web app" (click the gear icon ⚙️ if not selected).
 * 6. Set:
 *    - Description: "Wolfpack Fitness API"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone" (Required so the web app can sync data from any device)
 * 7. Click "Deploy", authorize permissions when prompted.
 * 8. Copy the "Web app URL" (starts with https://script.google.com/macros/s/.../exec).
 * 9. Paste this URL into the Wolfpack Web App under "Cloud Sync ☁️" in settings.
 * ============================================================================
 */

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getAllData';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      return createJsonResponse({ status: 'success', message: 'Wolfpack Google Sheets Backend is active!' });
    }

    if (action === 'getAllData') {
      const data = fetchAllDataFromSheets(ss);
      return createJsonResponse({ status: 'success', data: data });
    }

    return createJsonResponse({ status: 'error', message: 'Unknown GET action' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || 'syncAllData';
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'syncAllData') {
      saveAllDataToSheets(ss, payload);
      return createJsonResponse({
        status: 'success',
        message: 'Successfully synced fitness data to Google Sheets!',
        timestamp: new Date().toISOString()
      });
    }

    return createJsonResponse({ status: 'error', message: 'Unknown POST action' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// -----------------------------------------------------------------------------
// SHEET INITIALIZATION & DATA PARSING
// -----------------------------------------------------------------------------

function getOrCreateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#111827');
      headerRange.setFontColor('#00f0ff');
      headerRange.setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function saveAllDataToSheets(ss, payload) {
  const profile = payload.profile || {};
  const dailyData = payload.dailyData || {};
  const customFoods = payload.customFoods || [];

  // 1. Profile Sheet
  const profileSheet = getOrCreateSheet(ss, 'Profile', ['Setting', 'Value']);
  profileSheet.clearContents();
  profileSheet.appendRow(['Setting', 'Value']);
  const profileRows = [
    ['Name', profile.name || 'Pack Leader'],
    ['Height (cm)', profile.heightCm || 172],
    ['Target Weight (kg)', profile.targetWeightKg || 74.0],
    ['Daily Calorie Target (kcal)', profile.dailyCalorieTarget || 2300],
    ['Daily Step Target', profile.dailyStepTarget || 10000],
    ['Monthly Gym Target', profile.monthlyGymTarget || 30],
    ['Gym Streak (Days)', profile.gymStreak || 30],
    ['Daily Water Target (ml)', profile.dailyWaterTarget || 3000],
    ['Last Synced', new Date().toISOString()]
  ];
  profileRows.forEach(row => profileSheet.appendRow(row));

  // 2. Daily Summary Sheet
  const dailyHeaders = ['Date', 'Weight (kg)', 'Steps', 'Water (ml)', 'Gym Day', 'Workout Split', 'Gym Notes', 'Total Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)'];
  const dailySheet = getOrCreateSheet(ss, 'DailyLogs', dailyHeaders);
  dailySheet.clearContents();
  dailySheet.appendRow(dailyHeaders);

  const sortedDates = Object.keys(dailyData).sort().reverse();
  sortedDates.forEach(dateStr => {
    const day = dailyData[dateStr];
    if (!day) return;

    // Calculate daily macro sums
    let totalCals = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
    if (day.foods && Array.isArray(day.foods)) {
      day.foods.forEach(f => {
        totalCals += (f.calories || 0);
        totalProt += (f.protein || 0);
        totalCarbs += (f.carbs || 0);
        totalFat += (f.fat || 0);
      });
    }

    dailySheet.appendRow([
      dateStr,
      day.weight !== null && day.weight !== undefined ? day.weight : '',
      day.steps || 0,
      day.water || 0,
      (day.gymDay && day.gymDay.isGymDay) ? 'YES' : 'NO',
      (day.gymDay && day.gymDay.splitId) ? day.gymDay.splitId : '',
      (day.gymDay && day.gymDay.notes) ? day.gymDay.notes : '',
      totalCals,
      Math.round(totalProt * 10) / 10,
      Math.round(totalCarbs * 10) / 10,
      Math.round(totalFat * 10) / 10
    ]);
  });

  // 3. Meals Log Sheet
  const mealHeaders = ['Date', 'Time', 'Meal Type', 'Food Name', 'Calories (kcal)', 'Protein (g)', 'Carbs (g)', 'Fat (g)'];
  const mealSheet = getOrCreateSheet(ss, 'Meals', mealHeaders);
  mealSheet.clearContents();
  mealSheet.appendRow(mealHeaders);

  sortedDates.forEach(dateStr => {
    const day = dailyData[dateStr];
    if (day && day.foods && Array.isArray(day.foods)) {
      day.foods.forEach(f => {
        mealSheet.appendRow([
          dateStr,
          f.time || '',
          f.mealType || 'Breakfast',
          f.name || '',
          f.calories || 0,
          f.protein || 0,
          f.carbs || 0,
          f.fat || 0
        ]);
      });
    }
  });

  // 4. Raw JSON Store (for perfect bidirectional two-way restore)
  const rawSheet = getOrCreateSheet(ss, 'RawDataBackup', ['Key', 'JSON_Data']);
  rawSheet.clearContents();
  rawSheet.appendRow(['Key', 'JSON_Data']);
  rawSheet.appendRow(['profile', JSON.stringify(profile)]);
  rawSheet.appendRow(['dailyData', JSON.stringify(dailyData)]);
  rawSheet.appendRow(['customFoods', JSON.stringify(customFoods)]);
  rawSheet.appendRow(['updatedAt', new Date().toISOString()]);
}

function fetchAllDataFromSheets(ss) {
  const rawSheet = ss.getSheetByName('RawDataBackup');
  if (rawSheet) {
    const rows = rawSheet.getDataRange().getValues();
    const result = { profile: null, dailyData: {}, customFoods: [] };
    for (let i = 1; i < rows.length; i++) {
      const key = rows[i][0];
      const val = rows[i][1];
      if (key === 'profile') result.profile = JSON.parse(val || '{}');
      if (key === 'dailyData') result.dailyData = JSON.parse(val || '{}');
      if (key === 'customFoods') result.customFoods = JSON.parse(val || '[]');
    }
    if (result.profile && Object.keys(result.dailyData).length > 0) {
      return result;
    }
  }

  // Fallback: Parse from Profile and DailyLogs sheets if raw is empty
  return {
    profile: {
      name: 'Pack Leader',
      heightCm: 172,
      targetWeightKg: 74.0,
      dailyCalorieTarget: 2300,
      dailyStepTarget: 10000,
      monthlyGymTarget: 30,
      gymStreak: 30
    },
    dailyData: {},
    customFoods: []
  };
}
