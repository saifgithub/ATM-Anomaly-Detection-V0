import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../components/Dashboard/DashboardLayout';
import { DashboardPage } from './Dashboard/DashboardPage';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}
