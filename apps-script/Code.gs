/**
 * Tempo Sheets API (Apps Script Web App)
 *
 * Frontend contract:
 * POST JSON body:
 * {
 *   action: 'getAll' | 'upsert' | 'upsertMany' | 'delete',
 *   token?: string,
 *   payload?: object
 * }
 *
 * Response JSON:
 * { ok: true, data: any }
 * { ok: false, error: string }
 */

const CONFIG = {
  // If empty, script uses the bound spreadsheet (SpreadsheetApp.getActiveSpreadsheet()).
  SPREADSHEET_ID: '',

  // Optional static fallback token. Prefer Script Properties: SHEETS_API_TOKEN.
  API_TOKEN: '',

  COLLECTION_SHEETS: {
    shifts: 'shifts',
    students: 'students',
    attendances: 'attendances',
    payments: 'payments',
    users: 'users',
  },

  COLLECTION_HEADERS: {
    shifts: ['id', 'name', 'time', 'weekday', 'days', 'course', 'createdAt'],
    students: ['id', 'name', 'phone', 'email', 'birthDate', 'shifts', 'status', 'joinDate', 'createdAt'],
    attendances: ['id', 'date', 'shiftId', 'studentId', 'status', 'note', 'updatedAt'],
    payments: [
      'id',
      'studentId',
      'cycleIndex',
      'sessionsTarget',
      'shiftId',
      'month',
      'amountPaid',
      'totalAmount',
      'status',
      'paymentDate',
      'note',
      'receiptUrl',
      'updatedAt',
    ],
    users: ['id', 'name', 'email', 'password', 'role', 'createdAt'],
  },
};

const JSON_PREFIX = '__JSON__:';

function doGet() {
  return jsonResponse_({
    ok: true,
    data: {
      service: 'tempo-sheets-api',
      status: 'ok',
      actions: ['getAll', 'upsert', 'upsertMany', 'delete'],
    },
  });
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    enforceToken_(body.token);

    const action = body.action;
    const payload = body.payload || {};

    if (action === 'getAll') {
      return jsonResponse_({ ok: true, data: getAllData_() });
    }

    if (action === 'upsert') {
      const collection = payload.collection;
      const item = payload.item;
      upsertOne_(collection, item);
      return jsonResponse_({ ok: true, data: { updated: 1 } });
    }

    if (action === 'upsertMany') {
      const collection = payload.collection;
      const items = payload.items;
      const updated = upsertMany_(collection, items);
      return jsonResponse_({ ok: true, data: { updated: updated } });
    }

    if (action === 'delete') {
      const collection = payload.collection;
      const id = payload.id;
      const deleted = deleteOne_(collection, id);
      return jsonResponse_({ ok: true, data: { deleted: deleted ? 1 : 0 } });
    }

    throw new Error('Unsupported action: ' + String(action));
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : String(error),
    });
  }
}

function getAllData_() {
  const result = {};
  Object.keys(CONFIG.COLLECTION_SHEETS).forEach(function (collection) {
    result[collection] = getCollectionRows_(collection);
  });
  return result;
}

function getCollectionRows_(collection) {
  validateCollection_(collection);
  const sheet = ensureSheet_(collection);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (isEmptyRow_(row)) {
      continue;
    }

    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      obj[key] = deserializeCell_(row[c]);
    }
    rows.push(obj);
  }
  return rows;
}

function upsertOne_(collection, item) {
  validateCollection_(collection);
  if (!item || typeof item !== 'object') {
    throw new Error('Invalid item for upsert.');
  }
  if (!item.id || typeof item.id !== 'string') {
    throw new Error('Item must include string field id.');
  }

  const sheet = ensureSheet_(collection);
  const headers = CONFIG.COLLECTION_HEADERS[collection];
  const idValue = item.id;

  const data = sheet.getDataRange().getValues();
  let targetRow = -1;

  if (data.length > 1) {
    const idColumnIndex = headers.indexOf('id');
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][idColumnIndex]) === idValue) {
        targetRow = r + 1;
        break;
      }
    }
  }

  const rowValues = headers.map(function (key) {
    return serializeCell_(Object.prototype.hasOwnProperty.call(item, key) ? item[key] : '');
  });

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function upsertMany_(collection, items) {
  validateCollection_(collection);
  if (!Array.isArray(items)) {
    throw new Error('items must be an array.');
  }

  let updated = 0;
  items.forEach(function (item) {
    upsertOne_(collection, item);
    updated += 1;
  });
  return updated;
}

function deleteOne_(collection, id) {
  validateCollection_(collection);
  if (!id || typeof id !== 'string') {
    throw new Error('delete requires string id.');
  }

  const sheet = ensureSheet_(collection);
  const headers = CONFIG.COLLECTION_HEADERS[collection];
  const idColumnIndex = headers.indexOf('id');
  const values = sheet.getDataRange().getValues();

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idColumnIndex]) === id) {
      sheet.deleteRow(r + 1);
      return true;
    }
  }
  return false;
}

function ensureSheet_(collection) {
  const spreadsheet = getSpreadsheet_();
  const sheetName = CONFIG.COLLECTION_SHEETS[collection];

  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const headers = CONFIG.COLLECTION_HEADERS[collection];
  const lastColumn = Math.max(sheet.getLastColumn(), headers.length);

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const currentPrefix = currentHeaders.slice(0, headers.length);
    if (!arrayEquals_(currentPrefix, headers)) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  }

  return sheet;
}

function getSpreadsheet_() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim()) {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function validateCollection_(collection) {
  if (!Object.prototype.hasOwnProperty.call(CONFIG.COLLECTION_SHEETS, collection)) {
    throw new Error('Unsupported collection: ' + String(collection));
  }
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing request body. Use POST JSON.');
  }

  let parsed;
  try {
    parsed = JSON.parse(e.postData.contents);
  } catch (_error) {
    throw new Error('Invalid JSON body.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Request body must be a JSON object.');
  }

  return parsed;
}

function enforceToken_(providedToken) {
  const requiredToken = getRequiredToken_();
  if (!requiredToken) {
    return;
  }

  if (providedToken !== requiredToken) {
    throw new Error('Unauthorized: invalid token.');
  }
}

function getRequiredToken_() {
  const scriptToken = PropertiesService.getScriptProperties().getProperty('SHEETS_API_TOKEN');
  if (scriptToken && scriptToken.trim()) {
    return scriptToken.trim();
  }

  if (CONFIG.API_TOKEN && CONFIG.API_TOKEN.trim()) {
    return CONFIG.API_TOKEN.trim();
  }

  return '';
}

function serializeCell_(value) {
  if (value === null || typeof value === 'undefined') {
    return '';
  }

  if (Array.isArray(value) || (typeof value === 'object' && !(value instanceof Date))) {
    return JSON_PREFIX + JSON.stringify(value);
  }

  return value;
}

function deserializeCell_(value) {
  if (typeof value === 'string' && value.indexOf(JSON_PREFIX) === 0) {
    const raw = value.substring(JSON_PREFIX.length);
    try {
      return JSON.parse(raw);
    } catch (_error) {
      return value;
    }
  }
  return value;
}

function isEmptyRow_(row) {
  for (let i = 0; i < row.length; i++) {
    if (String(row[i]).trim() !== '') {
      return false;
    }
  }
  return true;
}

function arrayEquals_(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (String(a[i]) !== String(b[i])) {
      return false;
    }
  }
  return true;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
