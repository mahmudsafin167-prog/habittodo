import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = {
  title: "Register - Productivity App",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <AuthForm type="register" />
    </div>
  );
}
