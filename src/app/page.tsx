export default function HomePage() {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Welcome to Role-Based Access Control</h1>
          <p className="text-lg mt-4">Manage users with AWS Amplify & Cognito</p>
          <div className="mt-6">
            <a
              href="/auth"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Sign In / Sign Up
            </a>
          </div>
        </div>
      </div>
    );
  }
  