import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn } from "lucide-react";

const Login = () => {
    const { session, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (session) {
            navigate("/");
        }
    }, [session, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>
                        Sign in to access your certifications and progress
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6 pt-0">
                    <Button
                        size="lg"
                        className="w-full gap-2"
                        onClick={() => signInWithGoogle()}
                    >
                        <LogIn className="h-5 w-5" />
                        Sign in with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
