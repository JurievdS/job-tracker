import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Job Tracker</h1>
          <p className="text-gray-600 mt-2">Track your job search journey</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
