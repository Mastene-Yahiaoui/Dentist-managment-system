import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "DentNotion - Dental Clinic Management",
  description: "Complete dental clinic management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen bg-gray-100">
          <Sidebar />
          <div className="flex-1 ml-64">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
