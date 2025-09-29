import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  console.log('🔐 LoginPage component loaded');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  console.log('🔐 Login function available:', typeof login);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Watch form values for debugging
  const watchedValues = watch();
  console.log('📋 Form state:', { errors, isSubmitting });
  console.log('📝 Form values:', watchedValues);

  // Debug form values changes
  useEffect(() => {
    console.log('📝 Form values changed:', watchedValues);
  }, [watchedValues]);

  const onSubmit = async (data: LoginFormData) => {
    console.log('📝 Form submitted with data:', { email: data.email, password: '***' });
    try {
      console.log('🔄 Calling login function...');
      await login(data.email, data.password);
      console.log('✅ Login function completed');
    } catch (error) {
      console.error('❌ Login function failed:', error);
      // Error is handled in the auth context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Building2 className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            FE Homestay Manager
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the homestay management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Test with basic HTML input */}
              <div className="space-y-2">
                <label className="label">Email address (Test)</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="input w-full"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="label">Password (Test)</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="input w-full pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isSubmitting}
              >
                Sign In
              </Button>

              {/* Debug button to test login directly */}
              <Button
                type="button"
                className="w-full mt-2 bg-red-500 hover:bg-red-600"
                onClick={() => {
                  console.log('🧪 Debug button clicked - testing login directly');
                  onSubmit({ email: 'admin@homestay.com', password: 'admin123' });
                }}
              >
                Debug Login (Test)
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Demo Credentials</span>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p><strong>Admin:</strong> admin@homestay.com / admin123</p>
                <p><strong>Finance:</strong> finance@homestay.com / finance123</p>
                <p><strong>Cleaner:</strong> cleaner@homestay.com / cleaner123</p>
                <p><strong>Agent:</strong> agent@homestay.com / agent123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
