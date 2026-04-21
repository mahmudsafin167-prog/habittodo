import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Login - Productivity App",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <AuthForm type="login" />
    </div>
  );
}
