export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-6">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-lg mb-6">This page could not be found.</p>
      <a
        href="/"
        className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
      >
        Go back home
      </a>
    </div>
  );
}
