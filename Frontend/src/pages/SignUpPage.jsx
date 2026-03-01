import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import axios from "axios";

const API_URL = "http://localhost:5000";

// Google SVG Icon
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default function SignUpPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await axios.post(`${API_URL}/auth/signup`, formData);
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            navigate("/home");
        } catch (err) {
            setError(err.response?.data?.message || "Signup failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#ffffff] p-6 font-sans">
            {/* Header */}
            <h1 className="text-[32px] font-bold text-[#111827] mb-8 tracking-tight">Sign up</h1>

            {/* Main Card */}
            <Card className="w-full max-w-[440px] border-[#eff0f1] shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] bg-white">
                <CardContent className="p-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 text-[14px] px-4 py-3 rounded-[8px]">
                                {error}
                            </div>
                        )}

                        {/* Name Fields Row */}
                        <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="firstName" className="text-[14px] font-semibold text-[#111827] block">First name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    placeholder="Your first name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="h-[48px] border-[#d1d5db] bg-white rounded-[8px] px-4 text-[15px] focus:ring-1 focus:ring-black focus:border-black focus:bg-white transition-all shadow-none"
                                    required
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="lastName" className="text-[14px] font-semibold text-[#111827] block">Last name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    placeholder="Your last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="h-[48px] border-[#d1d5db] bg-white rounded-[8px] px-4 text-[15px] focus:ring-1 focus:ring-black focus:border-black focus:bg-white transition-all shadow-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[14px] font-semibold text-[#111827] block">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Your email address"
                                value={formData.email}
                                onChange={handleChange}
                                className="h-[48px] border-[#d1d5db] bg-white rounded-[8px] px-4 text-[15px] focus:ring-1 focus:ring-black focus:border-black focus:bg-white transition-all shadow-none"
                                required
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-[14px] font-semibold text-[#111827] block">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="Create a password (min 6 chars)"
                                value={formData.password}
                                onChange={handleChange}
                                className="h-[48px] border-[#d1d5db] bg-white rounded-[8px] px-4 text-[15px] focus:ring-1 focus:ring-black focus:border-black focus:bg-white transition-all shadow-none"
                                required
                                minLength={6}
                            />
                        </div>

                        {/* Continue Button */}
                        <Button
                            type="submit"
                            className="w-full h-[48px] bg-black hover:bg-[#2d2d2d] text-white rounded-[8px] text-[15px] font-bold transition-all mt-2 active:scale-[0.98] shadow-none"
                            disabled={isLoading}
                        >
                            {isLoading ? "Please wait..." : "Continue"}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-[#f1f1f1]" />
                        </div>
                        <div className="relative flex justify-center text-[10px] font-bold text-[#9ca3af] tracking-[0.2em]">
                            <span className="bg-white px-3 uppercase">OR</span>
                        </div>
                    </div>

                    {/* Social Login */}
                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            onClick={handleGoogleSignUp}
                            className="w-full h-[48px] border-[#d1d5db] rounded-[8px] text-[15px] font-semibold flex items-center justify-center gap-3 hover:bg-[#fafafa] bg-white transition-all shadow-none"
                        >
                            <GoogleIcon />
                            <span>Continue with Google</span>
                        </Button>
                    </div>

                    {/* Already have link */}
                    <div className="mt-8 text-center">
                        <p className="text-[15px] text-[#4b5563]">
                            Already have an account?{" "}
                            <Link to="/login" className="text-[#111827] font-semibold hover:underline decoration-1 underline-offset-2">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-12 text-center max-w-[340px]">
                <p className="text-[13px] text-[#9ca3af] leading-relaxed">
                    By creating an account, you agree to the<br />
                    <span className="cursor-pointer hover:text-[#4b5563]">Terms of Service</span> and <span className="cursor-pointer hover:text-[#4b5563]">Privacy Policy</span>
                </p>
            </div>
        </div>
    );
}
