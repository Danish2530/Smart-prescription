import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ReminderProvider } from './context/ReminderContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ReminderModal from './components/ReminderModal';

// Existing Pages (Preserved)
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

// New PRESCRIPTO Healthcare Pages
import FindDoctorPage from './pages/FindDoctorPage';
import DoctorProfilePage from './pages/DoctorProfilePage';
import AppointmentsPage from './pages/AppointmentsPage';
import VideoConsultationPage from './pages/VideoConsultationPage';
import AIHealthAssistantPage from './pages/AIHealthAssistantPage';
import ProfilePage from './pages/ProfilePage';

// New Doctor Console Pages
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import DoctorAppointmentsPage from './pages/DoctorAppointmentsPage';
import DoctorAvailabilityPage from './pages/DoctorAvailabilityPage';

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

                {/* Patient Routes (Protected) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* PRESCRIPTO Doctor Discovery & Booking */}
                <Route
                  path="/doctors"
                  element={
                    <ProtectedRoute>
                      <FindDoctorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctors/:id"
                  element={
                    <ProtectedRoute>
                      <DoctorProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    <ProtectedRoute>
                      <AppointmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/video-consultation/:appointmentId"
                  element={
                    <ProtectedRoute>
                      <VideoConsultationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/health-assistant"
                  element={
                    <ProtectedRoute>
                      <AIHealthAssistantPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Doctor Admin Console (Protected) */}
                <Route
                  path="/doctor/dashboard"
                  element={
                    <ProtectedRoute>
                      <DoctorDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/appointments"
                  element={
                    <ProtectedRoute>
                      <DoctorAppointmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/doctor/availability"
                  element={
                    <ProtectedRoute>
                      <DoctorAvailabilityPage />
                    </ProtectedRoute>
                  }
                />

                {/* Existing Prescription & Medication Pipeline (Untouched) */}
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
