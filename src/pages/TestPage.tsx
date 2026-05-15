export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Aurevina Test Page</h1>
        <p className="text-gray-600 mb-8">Jika Anda melihat ini, React berjalan dengan baik!</p>
        <div className="space-y-4">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Landing Page
          </a>
          <br />
          <a
            href="/admin"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
