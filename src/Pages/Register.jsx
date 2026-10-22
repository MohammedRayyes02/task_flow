import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router"
import * as z from "zod"
import { Button } from "@/components/ui/button"
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

const RegisterSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

export default function Register() {
    const { registerUser } = useAuth()
    const navigate = useNavigate()
    const [authError, setAuthError] = useState("")

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        }
    })

    const onSubmit = async (data) => {
        setAuthError("")
        try {
            await registerUser(data.email, data.password, data.fullName)
            navigate("/dashboard")
        } catch (error) {
            console.error("Registration error:", error)
            if (error.code === "auth/email-already-in-use") {
                setAuthError("An account with this email already exists.")
            } else if (error.code === "auth/weak-password") {
                setAuthError("Password should be at least 6 characters.")
            } else if (error.code === "auth/invalid-email") {
                setAuthError("The email address is invalid.")
            } else {
                setAuthError(error.message || "Failed to create account. Please try again.")
            }
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Register your account</CardTitle>
                    <CardDescription>
                        Enter your details below to create a new account
                    </CardDescription>
                    <CardAction>
                        <Link to="/login">
                            <Button variant="link">Login</Button>
                        </Link>
                    </CardAction>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-5">
                            {authError && (
                                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                                    {authError}
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                    {...register("fullName")}
                                />
                                {errors.fullName && (
                                    <span className="text-xs font-semibold text-destructive">
                                        {errors.fullName.message}
                                    </span>
                                )}
                            </div>

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
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    {...register("password")}
                                />
                                {errors.password && (
                                    <span className="text-xs font-semibold text-destructive">
                                        {errors.password.message}
                                    </span>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    {...register("confirmPassword")}
                                />
                                {errors.confirmPassword && (
                                    <span className="text-xs font-semibold text-destructive">
                                        {errors.confirmPassword.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        <CardFooter className="flex-col gap-2 mt-6 px-0 pb-0">
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Registering..." : "Register"}
                            </Button>
                        </CardFooter>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
