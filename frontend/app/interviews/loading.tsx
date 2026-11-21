export default function Loading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-bg font-sans text-text">
      <div className="text-center space-y-4">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">
          Preparing your interview…
        </p>
      </div>
    </div>
  );
}
