import api from "../api/axios";
import type { Cliente } from "../types/cliente";

export const listarClientesActivos = () =>
  api.get<Cliente[]>("/clientes/mostrarActivos");

export const crearCliente = (
  data: Omit<Cliente, "idCliente">
) => api.post("/clientes", data);

export const actualizarCliente = (
  id: number,
  data: Omit<Cliente, "idCliente">
) => api.put(`/clientes/${id}`, data);

export const anularCliente = (id: number) =>
  api.put(`/clientes/anular/${id}`);