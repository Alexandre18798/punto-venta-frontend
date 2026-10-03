import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";

import axios from "axios";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";

import ExcelJS from "exceljs";
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

    setMensaje("");

    window.scrollTo({ top: 0, behavior: "smooth" });

  };



  const handleCancelar = () => {

    setForm(formInicial);

    setModoEdicion(false);

    setMensaje("");

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

      console.error("Error al anular cliente", error);

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



  const formatearFecha = (fecha: string | null) => {

    if (!fecha) return "";



    const fechaCorta = fecha.substring(0, 10);

    const partes = fechaCorta.split("-");



    if (partes.length !== 3) return fecha;



    return `${partes[2]}/${partes[1]}/${partes[0]}`;

  };



  const generarPDF = () => {

    const doc = new jsPDF({

      orientation: "landscape",

      unit: "mm",

      format: "a4"

    });
    doc.setFontSize(18);

    doc.setFont("helvetica", "bold");

    doc.text("Sistema Punto de Venta", 65, 20);



    doc.setFontSize(15);

    doc.setFont("helvetica", "bold");

    doc.text("Listado de Clientes", 65, 29);



    doc.setFontSize(10);

    doc.setFont("helvetica", "normal");

    doc.text(

      "Fecha: " + new Date().toLocaleDateString(),

      65,

      37

    );



    const columnas = [

      "Nombre",

      "Apellido",

      "Correo",

      "Teléfono",

      "Fecha de registro"

    ];



    const filas = clientes.map((cliente) => [

      cliente.nombre,

      cliente.apellido,

      cliente.email,

      cliente.telefono,

      formatearFecha(cliente.fechaRegistro)

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

    doc.save("clientes.pdf");

  };



  const verPDF = () => {

    const doc = generarPDF();

    const url = doc.output("bloburl");

    window.open(url, "_blank");

  };



  const exportarExcel = async () => {

    const libro = new ExcelJS.Workbook();

    const hoja = libro.addWorksheet("Clientes");
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



    hoja.getCell("C2").value = "Listado de Clientes";

    hoja.getCell("C2").font = {

      size: 16,

      bold: true

    };



    hoja.getCell("C3").value =

      "Fecha: " + new Date().toLocaleDateString();



    const encabezado = hoja.getRow(7);



    encabezado.values = [

      "Nombre",

      "Apellido",

      "Correo",

      "Teléfono",

      "Fecha de registro"

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



    clientes.forEach((cliente, indice) => {

      const fila = hoja.addRow([

        cliente.nombre,

        cliente.apellido,

        cliente.email,

        cliente.telefono,

        formatearFecha(cliente.fechaRegistro)

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



    hoja.getColumn(1).width = 25;

    hoja.getColumn(2).width = 25;

    hoja.getColumn(3).width = 35;

    hoja.getColumn(4).width = 20;

    hoja.getColumn(5).width = 22;



    const buffer = await libro.xlsx.writeBuffer();



    const blob = new Blob([buffer], {

      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    });



    const url = URL.createObjectURL(blob);

    const enlace = document.createElement("a");



    enlace.href = url;

    enlace.download = "clientes.xlsx";

    enlace.click();



    URL.revokeObjectURL(url);

  };



  return (

    <div className="min-h-screen bg-slate-100/70 px-4 py-8 md:px-6 md:py-10">

      <div className="mx-auto max-w-7xl space-y-8">



        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">

            Gestión de Clientes

          </h1>



          <p className="mt-2 text-sm text-slate-500 md:text-base">

            Registro y administración de clientes

          </p>

        </div>



        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">

            <h2 className="text-lg font-semibold text-slate-900">

              {modoEdicion ? "Modificar Cliente" : "Registrar Cliente"}

            </h2>



            <p className="mt-1 text-sm text-slate-500">

              Complete los datos del cliente

            </p>

          </div>



          <div className="p-6">

            {mensaje && (

              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">

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

                    placeholder="Ingrese el nombre"

                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

                  />

                </div>



                <div>

                  <label

                    htmlFor="apellido"

                    className="block text-sm font-semibold text-slate-700 mb-2"

                  >

                    Apellido

                  </label>



                  <input

                    type="text"

                    id="apellido"

                    name="apellido"

                    value={form.apellido}

                    onChange={handleChange}

                    placeholder="Ingrese el apellido"

                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

                  />

                </div>



                <div>

                  <label

                    htmlFor="email"

                    className="block text-sm font-semibold text-slate-700 mb-2"

                  >

                    Correo electrónico

                  </label>



                  <input

                    type="email"

                    id="email"

                    name="email"

                    value={form.email}

                    onChange={handleChange}

                    placeholder="ejemplo\@correo.com"

                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

                  />

                </div>



                <div>

                  <label

                    htmlFor="telefono"

                    className="block text-sm font-semibold text-slate-700 mb-2"

                  >

                    Teléfono

                  </label>



                  <input

                    type="text"

                    id="telefono"

                    name="telefono"

                    value={form.telefono}

                    onChange={handleChange}

                    placeholder="Ingrese el teléfono"

                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

                  />

                </div>



                <div>

                  <label

                    htmlFor="fechaRegistro"

                    className="block text-sm font-semibold text-slate-700 mb-2"

                  >

                    Fecha de registro

                  </label>



                  <input

                    type="date"

                    id="fechaRegistro"

                    name="fechaRegistro"

                    value={form.fechaRegistro ?? ""}

                    onChange={handleChange}

                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

                  />

                </div>



              </div>



              <div className="flex gap-3 mt-6">

                <button

                  type="submit"

                  className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"

                >

                  {modoEdicion ? "Guardar Cambios" : "Guardar Cliente"}

                </button>



                {modoEdicion && (

                  <button

                    type="button"

                    onClick={handleCancelar}

                    className="rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-200 active:scale-[0.98]"

                  >

                    Cancelar

                  </button>

                )}

              </div>

            </form>

          </div>

        </div>



        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">



          <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">



              <div>

                <h2 className="text-lg font-semibold text-slate-900">

                  Listado de Clientes

                </h2>



                <p className="mt-1 text-sm text-slate-500">

                  Clientes activos registrados

                </p>

              </div>



              <div className="flex flex-wrap items-center gap-3">



                <button

                  type="button"

                  onClick={verPDF}

                  className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"

                >

                  Ver PDF

                </button>



                <button

                  type="button"

                  onClick={exportarPDF}

                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"

                >

                  Descargar PDF

                </button>



                <button

                  type="button"

                  onClick={exportarExcel}

                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"

                >

                  Descargar Excel

                </button>



                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">

                  Total: {clientes.length}

                </span>



              </div>

            </div>

          </div>



          <div className="overflow-x-auto">

            <table className="w-full">



              <thead className="bg-slate-50">

                <tr>

                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase">

                    Nombre

                  </th>



                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase">

                    Apellido

                  </th>



                  <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600 uppercase">

                    Correo

                  </th>



                  <th className="px-5 py-4 text-center text-xs font-semibold text-slate-600 uppercase">

                    Teléfono

                  </th>



                  <th className="px-5 py-4 text-center text-xs font-semibold text-slate-600 uppercase">

                    Fecha

                  </th>



                  <th className="px-5 py-4 text-center text-xs font-semibold text-slate-600 uppercase">

                    Acciones

                  </th>

                </tr>

              </thead>



              <tbody className="divide-y divide-slate-200">



                {clientes.map((cliente) => (

                  <tr

                    key={cliente.idCliente}

                    className="transition hover:bg-blue-50/40"

                  >

                    <td className="px-5 py-4 font-medium text-slate-800">

                      {cliente.nombre}

                    </td>



                    <td className="px-5 py-4 text-slate-700">

                      {cliente.apellido}

                    </td>



                    <td className="px-5 py-4 text-slate-600">

                      {cliente.email}

                    </td>



                    <td className="px-5 py-4 text-center text-slate-700">

                      {cliente.telefono}

                    </td>



                    <td className="px-5 py-4 text-center text-slate-700">

                      {formatearFecha(cliente.fechaRegistro)}

                    </td>



                    <td className="px-5 py-4">

                      <div className="flex justify-center gap-2">



                        <button

                          onClick={() => handleModificar(cliente)}

                          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"

                        >

                          Modificar

                        </button>



                        <button

                          onClick={() =>

                            cliente.idCliente !== null &&

                            handleAnular(cliente.idCliente)

                          }

                          className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-sm font-medium px-4 py-2 rounded-lg transition"

                        >

                          Eliminar

                        </button>



                      </div>

                    </td>

                  </tr>

                ))}



                {clientes.length === 0 && (

                  <tr>

                    <td

                      colSpan={6}

                      className="px-6 py-10 text-center text-slate-500"

                    >

                      No hay clientes registrados

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



export default Clientes;