export interface Cliente {
  idCliente: number | null;
  estado: boolean | null;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  fechaRegistro: string | null;
}