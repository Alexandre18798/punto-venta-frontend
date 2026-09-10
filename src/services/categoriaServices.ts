import api from "../api/axios";
import type { Categoria } from "../types/categoria";

export const listarCategoriasActivas = () =>
  api.get<Categoria[]>("/categorias/mostrarActivos");

export const crearCategoria = (
  data: Omit<Categoria, "idCategoria">
) => api.post<Categoria>("/categorias", data);

export const actualizarCategoria = (
  id: number,
  data: Omit<Categoria, "idCategoria">
) => api.put<Categoria>(`/categorias/${id}`, data);

export const anularCategoria = (id: number) =>
  api.put<Categoria>(`/categorias/anular/${id}`);