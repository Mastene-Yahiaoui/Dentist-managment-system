import "./globals.css";
import Sidebar from "./components/Sidebar";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "Dentnotion - Dentist Management System",
  description: "Complete dentist management system for appointments, treatments, invoices, and patient records",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dentnotion",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 w-full md:ml-64 overflow-x-hidden">
              {children}
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
