// Layout for authentication pages (login, signup, forgot-password)
// This layout does NOT show the sidebar

import '../globals.css';

export const metadata = {
  title: "DentNotion - Authentication",
  description: "Login to DentNotion Dental Clinic Management System",
};

export default function AuthLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
