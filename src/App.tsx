import { Routes, Route } from "react-router-dom";
import Categorias from "./pages/Categorias";
import Productos from "./pages/Productos";
import Clientes from "./pages/Clientes";

function App() {
  return (
    <Routes>
      <Route path="/categorias" element={<Categorias />} />
      <Route path="/productos" element={<Productos />} />
      <Route path="/clientes" element={<Clientes />} />
    </Routes>
  );
}

export default App;