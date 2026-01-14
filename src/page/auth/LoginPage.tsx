import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FormField, Input, Button } from "@/src/component";
import { signIn } from "@/src/lib/auth";
import { useAuth } from "@/src/lib/AuthProvider";
import toast from "react-hot-toast";

interface FormState {
	email: string;
	password: string;
}

interface FormError {
	email?: string;
	password?: string;
	general?: string;
}

export function LoginPage() {
	const navigate = useNavigate();
	const { session, refresh } = useAuth();
	const [form, setForm] = useState<FormState>({ email: "", password: "" });
	const [error, setError] = useState<FormError>({});
	const [isLoading, setIsLoading] = useState(false);

	// Redirect if already authenticated
	useEffect(() => {
		if (session) {
			navigate("/", { replace: true });
		}
	}, [session, navigate]);

	const validate = (): boolean => {
		const newError: FormError = {};
		if (!form.email.trim()) {
			newError.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
			newError.email = "Invalid email format";
		}
		if (!form.password) {
			newError.password = "Password is required";
		}
		setError(newError);
		return Object.keys(newError).length === 0;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setIsLoading(true);
		setError({});

		const result = await signIn.email({
			email: form.email,
			password: form.password,
		});

		if (result.error) {
			setError({ general: result.error.message || "Login failed" });
			setIsLoading(false);
			return;
		}

		toast.success("Login successful");
		await refresh();
		navigate("/", { replace: true });
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-geist-bg-secondary">
			<div className="w-full max-w-md space-y-6 rounded-lg border border-geist-border bg-geist-bg p-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-geist-fg">
						Sign In
					</h1>
					<p className="mt-2 text-sm text-geist-fg-secondary">
						Welcome back to Nona
					</p>
				</div>

				{error.general && (
					<div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600   ">
						{error.general}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
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
							placeholder="Enter your password"
							disabled={isLoading}
						/>
					</FormField>

					<Button type="submit" isLoading={isLoading} className="w-full">
						Sign In
					</Button>
				</form>

				<p className="text-center text-sm text-geist-fg-muted">
					Contact admin for account access
				</p>
			</div>
		</div>
	);
}
