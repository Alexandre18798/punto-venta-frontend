import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import {
  listarClientesActivos,
  crearCliente,
  actualizarCliente,
  anularCliente
} from "../services/clienteServices";
import type { Cliente } from "../types/cliente";

const formInicial: Cliente = {
  idCliente: null,
  estado: true,
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  fechaRegistro: ""
};

function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState<Cliente>(formInicial);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargarClientes = async () => {
    try {
      const respuesta = await listarClientesActivos();
      setClientes(respuesta.data);
    } catch (error) {
      console.error("Error al listar clientes", error);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (modoEdicion && form.idCliente !== null) {
        await actualizarCliente(form.idCliente, form);
        setMensaje("Cliente actualizado correctamente");
      } else {
        await crearCliente(form);
        setMensaje("Cliente creado correctamente");
      }

      setForm(formInicial);
      setModoEdicion(false);
      cargarClientes();
    } catch (error) {
      setMensaje(obtenerMensajeError(error));
      console.error("Error al guardar cliente", error);
    }
  };

  const handleModificar = (cliente: Cliente) => {
    setForm({
      ...cliente,
      fechaRegistro: cliente.fechaRegistro
        ? cliente.fechaRegistro.substring(0, 10)
        : ""
    });

    setModoEdicion(true);
  };

  const handleAnular = async (idCliente: number) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas anular este cliente?"
    );

    if (!confirmar) return;

    try {
      await anularCliente(idCliente);
      setMensaje("Cliente anulado correctamente");
      cargarClientes();
    } catch (error) {
      setMensaje(obtenerMensajeError(error));
      console.error("Error al anular el cliente", error);
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

  const mostrarFecha = (fecha: string | null) => {
    if (!fecha) return "";

    return fecha.substring(0, 10);
  };

  return (
    <div>
      <h2>Ingresar/Modificar Clientes</h2>

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
          <label htmlFor="apellido">Apellido:</label>
          <input
            type="text"
            id="apellido"
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="telefono">Teléfono:</label>
          <input
            type="text"
            id="telefono"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="fechaRegistro">Fecha de registro:</label>
          <input
            type="date"
            id="fechaRegistro"
            name="fechaRegistro"
            value={form.fechaRegistro ?? ""}
            onChange={handleChange}
          />
        </div>

        <button type="submit">Guardar</button>
      </form>

      <h2>Listado de Clientes</h2>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Fecha de registro</th>
            <th>Modificar</th>
            <th>Eliminar</th>
          </tr>
        </thead>

        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.idCliente}>
              <td>{cliente.nombre}</td>
              <td>{cliente.apellido}</td>
              <td>{cliente.email}</td>
              <td>{cliente.telefono}</td>
              <td>{mostrarFecha(cliente.fechaRegistro)}</td>
              <td>
                <button onClick={() => handleModificar(cliente)}>
                  Modificar
                </button>
              </td>
              <td>
                <button
                  onClick={() =>
                    cliente.idCliente !== null &&
                    handleAnular(cliente.idCliente)
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

export default Clientes;