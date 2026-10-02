import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import Categorias from "./pages/Categorias";
import Productos from "./pages/Productos";
import Clientes from "./pages/Clientes";
import logo from "./assets/logo-punto-venta.png";

function App() {
  const estiloEnlace = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-lg font-medium transition ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <>
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-4">

            <div className="flex items-center gap-4">
              <img
                src={logo}
                alt="Sistema Punto de Venta"
                className="w-55 h-55 object-contain"
              />

              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Sistema Punto de Venta
                </h1>

                <p className="text-sm text-slate-500">
                  Administración
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <NavLink
                to="/categorias"
                className={estiloEnlace}
              >
                Categorías
              </NavLink>

              <NavLink
                to="/productos"
                className={estiloEnlace}
              >
                Productos
              </NavLink>

              <NavLink
                to="/clientes"
                className={estiloEnlace}
              >
                Clientes
              </NavLink>
            </nav>

          </div>
        </div>
      </header>

      <main>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/categorias" replace />}
          />

          <Route
            path="/categorias"
            element={<Categorias />}
          />

          <Route
            path="/productos"
            element={<Productos />}
          />

          <Route
            path="/clientes"
            element={<Clientes />}
          />
        </Routes>
      </main>
    </>
  );
}

export default App;