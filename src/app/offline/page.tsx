"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="card max-w-md w-full mx-4 text-center">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          You&apos;re Offline
        </h1>
        <p className="text-muted-foreground mb-6">
          It looks like you&apos;ve lost your internet connection. Please check
          your network and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
