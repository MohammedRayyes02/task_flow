import { useEffect, useState } from "react"
import { Link } from "react-router"
import PagesLayout from "../Layouts/Pages.Layout"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { collection, getDocs } from "firebase/firestore"
import { db } from "@/config/Firebase"
import { User, ExternalLink } from "lucide-react"

export default function Users() {
    const { currentUser } = useAuth()
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true)
            setError("")

            try {
                const snapshot = await getDocs(collection(db, "users"))

                const fetchedUsers = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }))

                setUsers(fetchedUsers)
            } catch (err) {
                console.error("Firebase error code:", err.code)
                console.error("Firebase error message:", err.message)
                if (err.code === "permission-denied") {
                    setError("Permission denied: You do not have permission to view all users in Firestore. Check your Firestore Security Rules.")
                } else {
                    setError(err.message || "Failed to load users.")
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchUsers()
    }, [])

    // Format Firebase Timestamp
    const formatDate = (value) => {
        if (!value) return "-"

        let date

        if (typeof value?.toDate === "function") {
            date = value.toDate()
        } else if (typeof value?.seconds === "number") {
            date = new Date(value.seconds * 1000)
        } else if (value instanceof Date) {
            date = value
        } else {
            date = new Date(value)
        }

        if (Number.isNaN(date.getTime())) {
            return "-"
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    return (
        <PagesLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Users Management
                        </h1>

                        <p className="mt-1 text-sm text-muted-foreground">
                            A list of all registered users in your application.
                        </p>
                    </div>

                    <Link to="/profile">
                        <Button variant="outline" size="sm" className="gap-2">
                            <User className="h-4 w-4" />
                            My Profile
                        </Button>
                    </Link>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                        <p className="font-semibold">Unable to fetch users</p>
                        <p className="mt-1 text-xs opacity-90">{error}</p>
                    </div>
                )}

                {/* Users Table */}
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <Table>
                        <TableCaption className="mb-4">
                            {isLoading
                                ? "Loading users..."
                                : error
                                ? "Error loading users"
                                : `Total registered users: ${users.length}`}
                        </TableCaption>

                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">
                                    Full Name
                                </TableHead>

                                <TableHead>Email</TableHead>

                                <TableHead>Role</TableHead>

                                <TableHead>Created At</TableHead>

                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        Loading users...
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-32 text-center text-destructive"
                                    >
                                        {error}
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-32 text-center text-muted-foreground"
                                    >
                                        No users found in database.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => {
                                    const isCurrentUser = user.id === currentUser?.uid

                                    return (
                                        <TableRow key={user.id} className={isCurrentUser ? "bg-muted/30" : ""}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span>{user.fullName || "Unknown"}</span>
                                                    {isCurrentUser && (
                                                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {user.email || "-"}
                                            </TableCell>

                                            <TableCell>
                                                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                                                    {user.role || "User"}
                                                </span>
                                            </TableCell>

                                            <TableCell className="text-muted-foreground text-xs">
                                                {formatDate(user.createdAt)}
                                            </TableCell>

                                            <TableCell className="text-right">
                                                {isCurrentUser ? (
                                                    <Link to="/profile">
                                                        <Button variant="ghost" size="xs" className="gap-1 text-xs">
                                                            <span>Manage</span>
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/60">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </PagesLayout>
    )
}
