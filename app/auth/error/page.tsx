export default function AuthErrorPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-heading text-2xl font-semibold">Authentication error</h1>
      <p className="text-muted-foreground">
        Something went wrong during sign-in. Please try again.111
      </p>
      <a href="/sign-in" className="text-sm underline underline-offset-4">
        Back to sign in
      </a>
    </main>
  )
}
