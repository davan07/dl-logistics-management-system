
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { encryptData, decryptData } from './crypto.js';

const app = express();
app.use(express.json({limit: process?.env?.API_PAYLOAD_MAX_SIZE || "7mb"}));

// Middleware for transparent payload encryption/decryption
app.use((req, res, next) => {
  // 1. Decrypt request body if encrypted payload is present
  if (req.body && req.body.payload) {
    try {
      const decrypted = decryptData(req.body.payload);
      req.body = JSON.parse(decrypted);
    } catch (err) {
      console.error('[Node Proxy] Failed to decrypt request payload:', err.message);
      return res.status(400).json({ error: 'Failed to decrypt request payload' });
    }
  }

  // 2. Intercept res.json to automatically encrypt outgoing JSON payloads
  const originalJson = res.json;
  res.json = function (data) {
    // Only encrypt standard JSON API objects/arrays and not error objects
    if (data && typeof data === 'object' && !data.error) {
      try {
        const encrypted = encryptData(JSON.stringify(data));
        return originalJson.call(this, { payload: encrypted });
      } catch (err) {
        console.error('[Node Proxy] Failed to encrypt response payload:', err.message);
      }
    }
    return originalJson.call(this, data);
  };

  next();
});

const PORT = process?.env?.API_BACKEND_PORT || 5000;
const API_BACKEND_HOST = process?.env?.API_BACKEND_HOST || "127.0.0.1";

// Initialize Supabase Client or Local Fallback
const SUPABASE_URL = process?.env?.SUPABASE_URL;
const SUPABASE_KEY = process?.env?.SUPABASE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  const cleanUrl = SUPABASE_URL.replace(/^["']|["']$/g, '');
  const cleanKey = SUPABASE_KEY.replace(/^["']|["']$/g, '');
  try {
    supabase = createClient(cleanUrl, cleanKey);
    console.log('[Node Proxy] Supabase client successfully initialized.');
  } catch (err) {
    console.error('[Node Proxy] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('[Node Proxy] Supabase keys missing. Running in local JSON database fallback mode.');
}

const FALLBACK_DB_FILE = path.join(process.cwd(), 'db_fallback.json');

function readFallbackDB() {
  if (!fs.existsSync(FALLBACK_DB_FILE)) {
    fs.writeFileSync(FALLBACK_DB_FILE, JSON.stringify({ customers: [], shipments: [], payments: [], expenses: [] }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(FALLBACK_DB_FILE, 'utf8'));
  } catch (err) {
    return { customers: [], shipments: [], payments: [], expenses: [] };
  }
}

function writeFallbackDB(data) {
  fs.writeFileSync(FALLBACK_DB_FILE, JSON.stringify(data, null, 2));
}

// Convert Snake Case properties to Camel Case
function toCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = toCamel(obj[key]);
    return acc;
  }, {});
}

// Convert Camel Case properties to Snake Case
function toSnake(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnake);
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    acc[snakeKey] = toSnake(obj[key]);
    return acc;
  }, {});
}

// Database CRUD Helper Functions
async function getTableData(tableName) {
  if (supabase) {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) throw new Error(error.message);
    return toCamel(data);
  } else {
    const db = readFallbackDB();
    return db[tableName] || [];
  }
}

async function insertTableData(tableName, item) {
  if (supabase) {
    const snakeBody = toSnake(item);
    if (tableName === 'customers') {
      delete snakeBody.outstanding;
    }
    const { data, error } = await supabase.from(tableName).insert([snakeBody]).select();
    if (error) throw new Error(error.message);
    return toCamel(data[0]);
  } else {
    const db = readFallbackDB();
    if (!db[tableName]) db[tableName] = [];
    db[tableName].push(item);
    writeFallbackDB(db);
    return item;
  }
}

async function updateTableData(tableName, id, item) {
  if (supabase) {
    const snakeBody = toSnake(item);
    delete snakeBody.id; // Prevent modifying primary key
    if (tableName === 'customers') {
      delete snakeBody.outstanding;
    }
    const { data, error } = await supabase.from(tableName).update(snakeBody).eq('id', id).select();
    if (error) throw new Error(error.message);
    return toCamel(data[0]);
  } else {
    const db = readFallbackDB();
    if (!db[tableName]) db[tableName] = [];
    const index = db[tableName].findIndex(i => i.id === id);
    if (index !== -1) {
      db[tableName][index] = { ...db[tableName][index], ...item };
      writeFallbackDB(db);
      return db[tableName][index];
    }
    throw new Error('Item not found');
  }
}

async function deleteTableData(tableName, id) {
  if (supabase) {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const db = readFallbackDB();
    if (db[tableName]) {
      if (tableName === 'customers') {
        db.payments = db.payments.filter(p => p.customerId !== id);
      }
      db[tableName] = db[tableName].filter(i => i.id !== id);
      writeFallbackDB(db);
    }
  }
}



// --- Database REST API Routes ---

// Customers Routes
app.get('/api/customers', async (req, res) => {
  try {
    const data = await getTableData('customers');
    res.json(data);
  } catch (error) {
    console.error('[Node Proxy] Error GET /api/customers:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customer = await insertTableData('customers', req.body);
    res.status(201).json(customer);
  } catch (error) {
    console.error('[Node Proxy] Error POST /api/customers:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const customer = await updateTableData('customers', req.params.id, req.body);
    res.json(customer);
  } catch (error) {
    console.error('[Node Proxy] Error PUT /api/customers:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await deleteTableData('customers', req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('[Node Proxy] Error DELETE /api/customers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Shipments Routes
app.get('/api/shipments', async (req, res) => {
  try {
    const data = await getTableData('shipments');
    res.json(data);
  } catch (error) {
    console.error('[Node Proxy] Error GET /api/shipments:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shipments', async (req, res) => {
  try {
    const shipment = await insertTableData('shipments', req.body);
    res.status(201).json(shipment);
  } catch (error) {
    console.error('[Node Proxy] Error POST /api/shipments:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/shipments/:id', async (req, res) => {
  try {
    const shipment = await updateTableData('shipments', req.params.id, req.body);
    res.json(shipment);
  } catch (error) {
    console.error('[Node Proxy] Error PUT /api/shipments:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/shipments/:id', async (req, res) => {
  try {
    await deleteTableData('shipments', req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('[Node Proxy] Error DELETE /api/shipments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Payments Routes
app.get('/api/payments', async (req, res) => {
  try {
    const data = await getTableData('payments');
    res.json(data);
  } catch (error) {
    console.error('[Node Proxy] Error GET /api/payments:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const payment = await insertTableData('payments', req.body);
    res.status(201).json(payment);
  } catch (error) {
    console.error('[Node Proxy] Error POST /api/payments:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    await deleteTableData('payments', req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('[Node Proxy] Error DELETE /api/payments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Expenses Routes
app.get('/api/expenses', async (req, res) => {
  try {
    const data = await getTableData('expenses');
    res.json(data);
  } catch (error) {
    console.error('[Node Proxy] Error GET /api/expenses:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const expense = await insertTableData('expenses', req.body);
    res.status(201).json(expense);
  } catch (error) {
    console.error('[Node Proxy] Error POST /api/expenses:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await deleteTableData('expenses', req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('[Node Proxy] Error DELETE /api/expenses:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('password')
        .eq('username', username.trim().toLowerCase())
        .single();
      
      if (error || !data) {
        if (error) {
          console.error('[Node Proxy] Login Supabase query error details:', error);
        }
        console.warn(`[Node Proxy] Failed login attempt for user: ${username}`);
        return res.status(401).json({ success: false, error: 'Invalid username or password' });
      }
      
      if (data.password === password) {
        return res.json({ success: true, message: 'Authentication successful' });
      } else {
        return res.status(401).json({ success: false, error: 'Invalid username or password' });
      }
    } else {
      // Local fallback auth
      if (username.trim().toLowerCase() === 'lokesh' && password === 'lokesh@7675') {
        return res.json({ success: true, message: 'Authentication successful (fallback)' });
      } else {
        return res.status(401).json({ success: false, error: 'Invalid username or password' });
      }
    }
  } catch (error) {
    console.error('[Node Proxy] Error POST /api/login:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, API_BACKEND_HOST, () => {
  console.log(`Logistics Backend listening at http://localhost:${PORT}`);
});


