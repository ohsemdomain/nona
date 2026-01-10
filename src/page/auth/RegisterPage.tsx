import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField, Input, Button } from "@/src/component";
import { signUp, useSession } from "@/src/lib/auth";
import toast from "react-hot-toast";

interface FormState {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
}

interface FormError {
	name?: string;
	email?: string;
	password?: string;
	confirmPassword?: string;
	general?: string;
}

export function RegisterPage() {
	const navigate = useNavigate();
	const { data: session } = useSession();
	const [form, setForm] = useState<FormState>({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState<FormError>({});
	const [isLoading, setIsLoading] = useState(false);

	// Redirect if already authenticated (handles post-signup session update)
	useEffect(() => {
		if (session) {
			navigate("/", { replace: true });
		}
	}, [session, navigate]);

	const validate = (): boolean => {
		const newError: FormError = {};
		if (!form.name.trim()) {
			newError.name = "Name is required";
		}
		if (!form.email.trim()) {
			newError.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
			newError.email = "Invalid email format";
		}
		if (!form.password) {
			newError.password = "Password is required";
		} else if (form.password.length < 8) {
			newError.password = "Password must be at least 8 characters";
		}
		if (form.password !== form.confirmPassword) {
			newError.confirmPassword = "Passwords do not match";
		}
		setError(newError);
		return Object.keys(newError).length === 0;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setIsLoading(true);
		setError({});

		const result = await signUp.email({
			name: form.name,
			email: form.email,
			password: form.password,
		});

		setIsLoading(false);

		if (result.error) {
			setError({ general: result.error.message || "Registration failed" });
			return;
		}

		toast.success("Account created successfully");
		// Navigation handled by useEffect when session updates
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
			<div className="w-full max-w-md space-y-6 rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
						Create Account
					</h1>
					<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
						Get started with Nona
					</p>
				</div>

				{error.general && (
					<div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
						{error.general}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					<FormField label="Name" htmlFor="name" error={error.name} required>
						<Input
							id="name"
							type="text"
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							placeholder="Your name"
							disabled={isLoading}
						/>
					</FormField>

					<FormField
						label="Email"
						htmlFor="email"
						error={error.email}
						required
					>
						<Input
							id="email"
							type="email"
							value={form.email}
							onChange={(e) => setForm({ ...form, email: e.target.value })}
							placeholder="you@example.com"
							disabled={isLoading}
						/>
					</FormField>

					<FormField
						label="Password"
						htmlFor="password"
						error={error.password}
						required
					>
						<Input
							id="password"
							type="password"
							value={form.password}
							onChange={(e) => setForm({ ...form, password: e.target.value })}
							placeholder="At least 8 characters"
							disabled={isLoading}
						/>
					</FormField>

					<FormField
						label="Confirm Password"
						htmlFor="confirmPassword"
						error={error.confirmPassword}
						required
					>
						<Input
							id="confirmPassword"
							type="password"
							value={form.confirmPassword}
							onChange={(e) =>
								setForm({ ...form, confirmPassword: e.target.value })
							}
							placeholder="Confirm your password"
							disabled={isLoading}
						/>
					</FormField>

					<Button type="submit" isLoading={isLoading} className="w-full">
						Create Account
					</Button>
				</form>

				<p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
					Already have an account?{" "}
					<Link
						to="/login"
						className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
					>
						Sign in
					</Link>
				</p>
			</div>
		</div>
	);
}
