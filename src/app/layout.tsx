import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantumLab 3D — Experimental Sandbox",
  description: "Interactive 3D Quantum Computing Learning Platform (Qubits, Superposition, Entanglement, Decoherence)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#070913] text-slate-100 min-h-screen antialiased flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
