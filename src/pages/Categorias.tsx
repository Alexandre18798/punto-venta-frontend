import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import {
  listarCategoriasActivas,
  crearCategoria,
  actualizarCategoria,
  anularCategoria
} from "../services/categoriaServices";
import type { Categoria } from "../types/categoria";

const formInicial: Categoria = {
  idCategoria: null,
  nombre: "",
  descripcion: ""
};

function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState<Categoria>(formInicial);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargarCategorias = async () => {
    try {
      const respuesta = await listarCategoriasActivas();
      setCategorias(respuesta.data);
    } catch (error) {
      console.error("Error al listar categorías", error);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (modoEdicion && form.idCategoria !== null) {
        await actualizarCategoria(form.idCategoria, form);
        setMensaje("Categoría actualizada correctamente");
      } else {
        await crearCategoria(form);
        setMensaje("Categoría creada correctamente");
      }

      setForm(formInicial);
      setModoEdicion(false);
      cargarCategorias();
    } catch (error) {
      setMensaje(obtenerMensajeError(error));
      console.error("Error al guardar categoría", error);
    }
  };

  const handleModificar = (categoria: Categoria) => {
    setForm(categoria);
    setModoEdicion(true);
  };

  const handleAnular = async (idCategoria: number) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas anular esta categoría?"
    );

    if (!confirmar) return;

    try {
      await anularCategoria(idCategoria);
      setMensaje("Categoría anulada correctamente");
      cargarCategorias();
    } catch (error) {
      setMensaje(obtenerMensajeError(error));
      console.error("Error al anular la categoría", error);
    }
  };

  const obtenerMensajeError = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.mensaje ?? error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Ocurrió un error inesperado";
  };

  return (
    <div>
      <h2>Ingresar/Modificar Categorías</h2>

      {mensaje && <p>{mensaje}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nombre">Nombre:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="descripcion">Descripción:</label>
          <input
            type="text"
            id="descripcion"
            name="descripcion"
            value={form.descripcion}
            onChange={handleChange}
          />
        </div>

        <button type="submit">Guardar</button>
      </form>

      <h2>Listado de Categorías</h2>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Modificar</th>
            <th>Eliminar</th>
          </tr>
        </thead>

        <tbody>
          {categorias.map((categoria) => (
            <tr key={categoria.idCategoria}>
              <td>{categoria.nombre}</td>
              <td>{categoria.descripcion}</td>
              <td>
                <button onClick={() => handleModificar(categoria)}>
                  Modificar
                </button>
              </td>
              <td>
                <button
                  onClick={() =>
                    categoria.idCategoria !== null &&
                    handleAnular(categoria.idCategoria)
                  }
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Categorias;