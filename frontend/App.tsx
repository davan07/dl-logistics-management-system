import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Shipments } from './pages/Shipments';
import { Payments } from './pages/Payments';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DataProvider } from './context/DataContext';

export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="shipments" element={<Shipments />} />
            <Route path="payments" element={<Payments />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </HashRouter>
    </DataProvider>
  );
}
