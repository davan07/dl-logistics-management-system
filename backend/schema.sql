-- ========================================================
-- DL Logistics Management System Database Setup Script
-- ========================================================
-- Copy-paste this script into the Supabase SQL Editor to create 
-- the tables and relationships for Customers, Shipments, Payments, and Expenses.

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL UNIQUE,
    contact_person TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive')),
    credit_limit NUMERIC NOT NULL DEFAULT 50000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Shipments Table
CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    lr_number TEXT NOT NULL UNIQUE,
    booking_date TEXT NOT NULL,
    consignor_name TEXT NOT NULL REFERENCES customers(company_name) ON UPDATE CASCADE ON DELETE RESTRICT,
    consignee_name TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    freight NUMERIC NOT NULL CHECK (freight >= 0),
    status TEXT NOT NULL CHECK (status IN ('Booked', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    payment_date TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'Bank Transfer', 'UPI', 'Cheque')),
    transaction_id TEXT NOT NULL,
    reference_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('Fuel', 'Driver Wages', 'Tolls', 'Maintenance', 'Rent/Office', 'Miscellaneous')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    expense_date TEXT NOT NULL,
    paid_to TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create basic indexes for performance optimizations
CREATE INDEX IF NOT EXISTS idx_shipments_consignor ON shipments(consignor_name);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- 5. Users Table
CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS) on all tables to secure them
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

