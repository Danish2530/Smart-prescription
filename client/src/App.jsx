import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ReminderProvider } from './context/ReminderContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ReminderModal from './components/ReminderModal';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import PrescriptionUploadPage from './pages/PrescriptionUploadPage';
import PrescriptionVerificationPage from './pages/PrescriptionVerificationPage';
import MedicationsPage from './pages/MedicationsPage';
import MedicationDetailPage from './pages/MedicationDetailPage';
import SchedulePage from './pages/SchedulePage';
import AdherenceDashboardPage from './pages/AdherenceDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReminderProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Patient Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prescriptions"
                  element={
                    <ProtectedRoute>
                      <PrescriptionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prescriptions/upload"
                  element={
                    <ProtectedRoute>
                      <PrescriptionUploadPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prescriptions/:id"
                  element={
                    <ProtectedRoute>
                      <PrescriptionVerificationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medications"
                  element={
                    <ProtectedRoute>
                      <MedicationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medications/:id"
                  element={
                    <ProtectedRoute>
                      <MedicationDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/schedule"
                  element={
                    <ProtectedRoute>
                      <SchedulePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/adherence"
                  element={
                    <ProtectedRoute>
                      <AdherenceDashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
            <ReminderModal />
          </div>
        </ReminderProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
