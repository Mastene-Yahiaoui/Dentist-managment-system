import "./globals.css";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "DentNotion - Dental Clinic Management",
  description: "Complete dental clinic management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 ml-64">
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
