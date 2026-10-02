import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import logo from "../assets/logo-punto-venta.png";

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

    if (name === "precio" || name === "stock") {
      setForm((prev) => ({
        ...prev,
        [name]: Number(value)
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
    setMensaje("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelar = () => {
    setForm(formInicial);
    setModoEdicion(false);
    setMensaje("");
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
      console.error("Error al anular producto", error);
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

    return categoria ? categoria.nombre : "Sin categoría";
  };

  const generarPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    doc.addImage(logo, "PNG", 14, 8, 42, 42);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Sistema Punto de Venta", 65, 20);

    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("Listado de Productos", 65, 29);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Fecha: " + new Date().toLocaleDateString(),
      65,
      37
    );

    const columnas = [
      "Producto",
      "Descripción",
      "Precio",
      "Stock",
      "Categoría"
    ];

    const filas = productos.map((producto) => [
      producto.nombre,
      producto.descripcion,
      "Q " + Number(producto.precio).toFixed(2),
      producto.stock,
      obtenerNombreCategoria(producto.idCategoria)
    ]);

    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 58,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      margin: {
        left: 14,
        right: 14
      }
    });

    return doc;
  };

  const exportarPDF = () => {
    const doc = generarPDF();
    doc.save("productos.pdf");
  };

  const verPDF = () => {
    const doc = generarPDF();
    const url = doc.output("bloburl");
    window.open(url, "_blank");
  };

  const exportarExcel = async () => {
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet("Productos");

    const respuestaLogo = await fetch(logo);
    const blobLogo = await respuestaLogo.blob();
    const bufferLogo = await blobLogo.arrayBuffer();

    const idLogo = libro.addImage({
      buffer: bufferLogo,
      extension: "png"
    });

    hoja.addImage(idLogo, {
      tl: { col: 0, row: 0 },
      ext: {
        width: 150,
        height: 150
      }
    });

    hoja.getRow(1).height = 30;
    hoja.getRow(2).height = 30;
    hoja.getRow(3).height = 30;
    hoja.getRow(4).height = 30;
    hoja.getRow(5).height = 30;

    hoja.getCell("C1").value = "Sistema Punto de Venta";
    hoja.getCell("C1").font = {
      size: 18,
      bold: true
    };

    hoja.getCell("C2").value = "Listado de Productos";
    hoja.getCell("C2").font = {
      size: 16,
      bold: true
    };

    hoja.getCell("C3").value =
      "Fecha: " + new Date().toLocaleDateString();

    const encabezado = hoja.getRow(7);

    encabezado.values = [
      "Producto",
      "Descripción",
      "Precio",
      "Stock",
      "Categoría"
    ];

    encabezado.eachCell((celda) => {
      celda.font = {
        bold: true,
        color: { argb: "FFFFFFFF" }
      };

      celda.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF166534" }
      };

      celda.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
    });

    productos.forEach((producto, indice) => {
      const fila = hoja.addRow([
        producto.nombre,
        producto.descripcion,
        Number(producto.precio),
        producto.stock,
        obtenerNombreCategoria(producto.idCategoria)
      ]);

      fila.eachCell((celda) => {
        celda.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };

        if (indice % 2 === 1) {
          celda.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDCFCE7" }
          };
        }
      });
    });

    hoja.getColumn(1).width = 30;
    hoja.getColumn(2).width = 45;
    hoja.getColumn(3).width = 15;
    hoja.getColumn(4).width = 15;
    hoja.getColumn(5).width = 25;

    hoja.getColumn(3).numFmt = '"Q" #,##0.00';

    const buffer = await libro.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "productos.xlsx";
    enlace.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-bold text-slate-800">
            Gestión de Productos
          </h1>

          <p className="mt-2 text-slate-500">
            Registro y administración de productos
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">
              {modoEdicion ? "Modificar Producto" : "Registrar Producto"}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Complete los datos del producto
            </p>
          </div>

          <div className="p-6">
            {mensaje && (
              <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
                {mensaje}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                  <label
                    htmlFor="nombre"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Nombre
                  </label>

                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ingrese el nombre del producto"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="descripcion"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Descripción
                  </label>

                  <input
                    type="text"
                    id="descripcion"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    placeholder="Ingrese una descripción"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="precio"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Precio
                  </label>

                  <input
                    type="number"
                    id="precio"
                    name="precio"
                    value={form.precio}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="stock"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Stock
                  </label>

                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    min="0"
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="idCategoria"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Categoría
                  </label>

                  <select
                    id="idCategoria"
                    name="idCategoria"
                    value={form.idCategoria ?? ""}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-700 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Seleccione una categoría
                    </option>

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

              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition"
                >
                  {modoEdicion ? "Guardar Cambios" : "Guardar Producto"}
                </button>

                {modoEdicion && (
                  <button
                    type="button"
                    onClick={handleCancelar}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium px-6 py-2.5 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

          <div className="px-6 py-5 border-b border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Listado de Productos
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Productos activos registrados
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">

                <button
                  type="button"
                  onClick={verPDF}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-lg transition"
                >
                  Ver PDF
                </button>

                <button
                  type="button"
                  onClick={exportarPDF}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition"
                >
                  Descargar PDF
                </button>

                <button
                  type="button"
                  onClick={exportarExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition"
                >
                  Descargar Excel
                </button>

                <span className="bg-slate-100 text-slate-600 text-sm font-medium px-3 py-1.5 rounded-lg">
                  Total: {productos.length}
                </span>

              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">

              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                    Producto
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                    Descripción
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-semibold text-slate-600 uppercase">
                    Precio
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-semibold text-slate-600 uppercase">
                    Stock
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-semibold text-slate-600 uppercase">
                    Categoría
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-semibold text-slate-600 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">

                {productos.map((producto) => (
                  <tr
                    key={producto.idProducto}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {producto.nombre}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {producto.descripcion}
                    </td>

                    <td className="px-5 py-4 text-center font-medium text-slate-700">
                      Q {Number(producto.precio).toFixed(2)}
                    </td>

                    <td className="px-5 py-4 text-center text-slate-700">
                      {producto.stock}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        {obtenerNombreCategoria(producto.idCategoria)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-2">

                        <button
                          onClick={() => handleModificar(producto)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                        >
                          Modificar
                        </button>

                        <button
                          onClick={() =>
                            producto.idProducto !== null &&
                            handleAnular(producto.idProducto)
                          }
                          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                        >
                          Eliminar
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}

                {productos.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      No hay productos registrados
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Productos;