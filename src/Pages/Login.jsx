import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Link, useNavigate } from "react-router"
import { useAuth } from "@/hooks/useAuth"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const LoginSchema = z.object({
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters")
})

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [authError, setAuthError] = useState("")

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    })

    const onSubmit = async (data) => {
        setAuthError("")
        try {
            await login(data.email, data.password)
            navigate("/dashboard")
        } catch (error) {
            console.error("Login error:", error)
            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/user-not-found" ||
                error.code === "auth/wrong-password"
            ) {
                setAuthError("Invalid email or password.")
            } else if (error.code === "auth/too-many-requests") {
                setAuthError("Too many failed attempts. Please try again later.")
            } else {
                setAuthError(error.message || "Failed to sign in. Please try again.")
            }
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                    <CardAction>
                        <Link to="/register">
                            <Button variant="link">Sign Up</Button>
                        </Link>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-6">
                            {authError && (
                                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                                    {authError}
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    autoComplete="email"
                                    {...register("email")}
                                />
                                {errors.email && (
                                    <span className="text-xs font-semibold text-destructive">
                                        {errors.email.message}
                                    </span>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <span className="text-xs font-semibold text-destructive">
                                        {errors.password.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        <CardFooter className="flex-col gap-2 mt-6 px-0 pb-0">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Logging in..." : "Login"}
                            </Button>
                        </CardFooter>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
