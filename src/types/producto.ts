export interface Producto {
  idProducto: number | null;
  estado: boolean | null;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  idCategoria: number | null;
}