import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import {
  listarProductosActivos,
  crearProducto,
  actualizarProducto,
  anularProducto
} from "../services/productoServices";
import { listarCategoriasActivas } from "../services/categoriaServices";
import type { Producto } from "../types/producto";
import type { Categoria } from "../types/categoria";

const formInicial: Producto = {
  idProducto: null,
  estado: true,
  nombre: "",
  descripcion: "",
  precio: 0,
  stock: 0,
  idCategoria: null
};

function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [form, setForm] = useState<Producto>(formInicial);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargarProductos = async () => {
    try {
      const respuesta = await listarProductosActivos();
      setProductos(respuesta.data);
    } catch (error) {
      console.error("Error al listar productos", error);
    }
  };

  const cargarCategorias = async () => {
    try {
      const respuesta = await listarCategoriasActivas();
      setCategorias(respuesta.data);
    } catch (error) {
      console.error("Error al listar categorías", error);
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "precio") {
      setForm((prev) => ({
        ...prev,
        precio: Number(value)
      }));
    } else if (name === "stock") {
      setForm((prev) => ({
        ...prev,
        stock: Number(value)
      }));
    } else if (name === "idCategoria") {
      setForm((prev) => ({
        ...prev,
        idCategoria: value === "" ? null : Number(value)
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (modoEdicion && form.idProducto !== null) {
        await actualizarProducto(form.idProducto, form);
        setMensaje("Producto actualizado correctamente");
      } else {
        await crearProducto(form);
        setMensaje("Producto creado correctamente");
      }

      setForm(formInicial);
      setModoEdicion(false);
      cargarProductos();
    } catch (error) {
      setMensaje(obtenerMensajeError(error));
      console.error("Error al guardar producto", error);
    }
  };

  const handleModificar = (producto: Producto) => {
    setForm(producto);
    setModoEdicion(true);
  };

  const handleAnular = async (idProducto: number) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas anular este producto?"
    );

    if (!confirmar) return;

    try {
      await anularProducto(idProducto);
      setMensaje("Producto anulado correctamente");
      cargarProductos();
    } catch (error) {
      setMensaje(obtenerMensajeError(error));
      console.error("Error al anular el producto", error);
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

  const obtenerNombreCategoria = (idCategoria: number | null) => {
    const categoria = categorias.find(
      (item) => item.idCategoria === idCategoria
    );

    return categoria?.nombre ?? "";
  };

  return (
    <div>
      <h2>Ingresar/Modificar Productos</h2>

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

        <div>
          <label htmlFor="precio">Precio:</label>
          <input
            type="number"
            id="precio"
            name="precio"
            value={form.precio}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="stock">Stock:</label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={form.stock}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="idCategoria">Categoría:</label>
          <select
            id="idCategoria"
            name="idCategoria"
            value={form.idCategoria ?? ""}
            onChange={handleChange}
          >
            <option value="">Seleccione una categoría</option>

            {categorias.map((categoria) => (
              <option
                key={categoria.idCategoria}
                value={categoria.idCategoria ?? ""}
              >
                {categoria.nombre}
              </option>
            ))}
          </select>
        </div>

        <button type="submit">Guardar</button>
      </form>

      <h2>Listado de Productos</h2>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Categoría</th>
            <th>Modificar</th>
            <th>Eliminar</th>
          </tr>
        </thead>

        <tbody>
          {productos.map((producto) => (
            <tr key={producto.idProducto}>
              <td>{producto.nombre}</td>
              <td>{producto.descripcion}</td>
              <td>{producto.precio}</td>
              <td>{producto.stock}</td>
              <td>{obtenerNombreCategoria(producto.idCategoria)}</td>
              <td>
                <button onClick={() => handleModificar(producto)}>
                  Modificar
                </button>
              </td>
              <td>
                <button
                  onClick={() =>
                    producto.idProducto !== null &&
                    handleAnular(producto.idProducto)
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

export default Productos;