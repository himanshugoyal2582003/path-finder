import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg-slate-900)] p-4">
      <div className="w-full max-w-md flex justify-center">
        <SignIn
          appearance={{
            elements: {
              card: "shadow-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl",
            },
          }}
        />
      </div>
    </main>
  );
}
