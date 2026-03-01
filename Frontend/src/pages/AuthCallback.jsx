import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            localStorage.setItem("token", token);

            // Decode basic user info from JWT payload (middle segment)
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                localStorage.setItem(
                    "user",
                    JSON.stringify({ id: payload.id, email: payload.email })
                );
            } catch {
                // If decoding fails, we still have the token
            }

            navigate("/home", { replace: true });
        } else {
            navigate("/login", { replace: true });
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Signing you in...</p>
            </div>
        </div>
    );
}
