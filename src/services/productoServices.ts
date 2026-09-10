import api from "../api/axios";
import type { Producto } from "../types/producto";

export const listarProductosActivos = () =>
  api.get<Producto[]>("/productos/mostrarActivos");

export const crearProducto = (
  data: Omit<Producto, "idProducto">
) => api.post("/productos", data);

export const actualizarProducto = (
  id: number,
  data: Omit<Producto, "idProducto">
) => api.put(`/productos/${id}`, data);

export const anularProducto = (id: number) =>
  api.put(`/productos/anular/${id}`);