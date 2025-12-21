// src/components/AuthScreen.tsx
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function AuthScreen() {
  const { googleLogin, emailLogin, emailSignup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      setError("");
      if (mode === "login") {
        await emailLogin(email, password);
      } else {
        await emailSignup(email, password);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {mode === "login" ? "Sign In" : "Create Account"}
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 text-sm rounded">
            {error}
          </div>
        )}

        <input
          className="w-full mb-3 p-2 border rounded"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          className="w-full mb-4 p-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button
          onClick={submit}
          className="w-full bg-blue-600 text-white p-2 rounded mb-3"
        >
          {mode === "login" ? "Login" : "Sign up"}
        </button>

        <button
          onClick={googleLogin}
          className="w-full bg-red-600 text-white p-2 rounded mb-4"
        >
          Continue with Google
        </button>

        <div className="text-center text-sm">
          {mode === "login" ? (
            <button onClick={() => setMode("signup")}>
              No account? Sign up
            </button>
          ) : (
            <button onClick={() => setMode("login")}>
              Already have an account? Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
