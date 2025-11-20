import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import ErrorBoundary from "./components/ErrorBoundary"; // Import ErrorBoundary

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary fallback={
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-700 p-4">
      <p className="text-lg font-semibold">Ocorreu um erro inesperado na aplicação. Por favor, tente novamente mais tarde.</p>
    </div>
  }>
    <App />
  </ErrorBoundary>
);