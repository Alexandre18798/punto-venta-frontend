import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import logo from "../assets/logo-punto-venta.png";

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

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
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
    setMensaje("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelar = () => {
    setForm(formInicial);
    setModoEdicion(false);
    setMensaje("");
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

  const generarPDF = () => {
    const doc = new jsPDF();

    doc.addImage(logo, "PNG", 14, 10, 42, 42);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Sistema Punto de Venta", 65, 22);

    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("Listado de Categorías", 65, 31);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Fecha: " + new Date().toLocaleDateString(),
      65,
      39
    );

    const columnas = ["Nombre", "Descripción"];

    const filas = categorias.map((categoria) => [
      categoria.nombre,
      categoria.descripcion
    ]);

    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 60,
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
      }
    });

    return doc;
  };

  const exportarPDF = () => {
    const doc = generarPDF();
    doc.save("categorias.pdf");
  };

  const verPDF = () => {
    const doc = generarPDF();
    const url = doc.output("bloburl");
    window.open(url, "_blank");
  };

  const exportarExcel = async () => {
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet("Categorías");

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

    hoja.getCell("C2").value = "Listado de Categorías";
    hoja.getCell("C2").font = {
      size: 16,
      bold: true
    };

    hoja.getCell("C3").value =
      "Fecha: " + new Date().toLocaleDateString();

    const encabezado = hoja.getRow(7);

    encabezado.values = [
      "Nombre",
      "Descripción"
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

    categorias.forEach((categoria, indice) => {
      const fila = hoja.addRow([
        categoria.nombre,
        categoria.descripcion
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
    hoja.getColumn(2).width = 60;
    hoja.getColumn(3).width = 30;

    const buffer = await libro.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "categorias.xlsx";
    enlace.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-bold text-slate-800">
            Gestión de Categorías
          </h1>

          <p className="mt-2 text-slate-500">
            Registro y administración de categorías
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">
              {modoEdicion ? "Modificar Categoría" : "Registrar Categoría"}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Complete los datos de la categoría
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
                    placeholder="Ingrese el nombre de la categoría"
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

              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition"
                >
                  {modoEdicion ? "Guardar Cambios" : "Guardar Categoría"}
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
                  Listado de Categorías
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Categorías activas registradas
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
                  Total: {categorias.length}
                </span>

              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">

              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                    Nombre
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                    Descripción
                  </th>

                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">

                {categorias.map((categoria) => (
                  <tr
                    key={categoria.idCategoria}
                    className="hover:bg-slate-50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {categoria.nombre}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {categoria.descripcion}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">

                        <button
                          onClick={() => handleModificar(categoria)}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                        >
                          Modificar
                        </button>

                        <button
                          onClick={() =>
                            categoria.idCategoria !== null &&
                            handleAnular(categoria.idCategoria)
                          }
                          className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                        >
                          Eliminar
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}

                {categorias.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-10 text-center text-slate-500"
                    >
                      No hay categorías registradas
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

export default Categorias;