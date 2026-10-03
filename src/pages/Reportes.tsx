import { useState } from "react";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";

import { listarCategoriasActivas } from "../services/categoriaServices";

import { listarProductosActivos } from "../services/productoServices";



type TipoReporte = "categorias" | "productos" | null;



export default function Reportes() {

  const [reporteActivo, setReporteActivo] = useState<TipoReporte>(null);

  const [nombre, setNombre] = useState("");

  const [mensaje, setMensaje] = useState("");



  const fechaActual = () => new Date().toLocaleDateString("es-GT");



  const encabezado = (doc: jsPDF, titulo: string) => {

    doc.setFontSize(18);

    doc.setFont("helvetica", "bold");

    doc.text(titulo, 14, 20);



    doc.setFontSize(10);

    doc.setFont("helvetica", "normal");

    doc.text(`Generado: ${fechaActual()}`, 14, 28);

  };



  const abrirReporte = (tipo: TipoReporte) => {

    setReporteActivo(tipo);

    setNombre("");

    setMensaje("");

  };



  const cerrarReporte = () => {

    setReporteActivo(null);

    setNombre("");

    setMensaje("");

  };



  const tituloModal = () => {

    if (reporteActivo === "categorias") {

      return "Reporte de categorías";

    }



    if (reporteActivo === "productos") {

      return "Reporte de productos";

    }



    return "";

  };



  const reporteProductosPDF = async () => {

    try {

      const respuesta = await listarProductosActivos();

      const productos = respuesta.data;



      const doc = new jsPDF();



      encabezado(doc, "Reporte de Productos");



      autoTable(doc, {

        startY: 35,

        head: [

          ["Producto", "Descripción", "Precio", "Stock", "Categoría"]

        ],

        body: productos.map((producto) => [

          producto.nombre,

          producto.descripcion,

          `Q ${Number(producto.precio).toFixed(2)}`,

          producto.stock,

          producto.idCategoria ?? "Sin categoría"

        ]),

        headStyles: {

          fillColor: [37, 99, 235]

        }

      });



      doc.save("reporte-productos.pdf");

    } catch {

      alert("No se pudo generar el reporte de productos.");

    }

  };



  const reporteCategoriasPDF = async () => {

    try {

      const respuesta = await listarCategoriasActivas();

      const categorias = respuesta.data;



      const doc = new jsPDF();



      encabezado(doc, "Reporte de Categorías");



      autoTable(doc, {

        startY: 35,

        head: [["Nombre", "Descripción"]],

        body: categorias.map((categoria) => [

          categoria.nombre,

          categoria.descripcion

        ]),

        headStyles: {

          fillColor: [37, 99, 235]

        }

      });



      doc.save("reporte-categorias.pdf");

    } catch {

      alert("No se pudo generar el reporte de categorías.");

    }

  };



  const productosYCategoriasPDF = async () => {

    try {

      const respuestaProductos = await listarProductosActivos();

      const respuestaCategorias = await listarCategoriasActivas();



      const productos = respuestaProductos.data;

      const categorias = respuestaCategorias.data;



      const doc = new jsPDF();



      encabezado(doc, "Reporte de Productos y Categorías");



      doc.setFontSize(14);

      doc.setFont("helvetica", "bold");

      doc.text("Productos", 14, 38);



      autoTable(doc, {

        startY: 43,

        head: [

          ["Producto", "Descripción", "Precio", "Stock", "Categoría"]

        ],

        body: productos.map((producto) => {

          const categoria = categorias.find(

            (item) => item.idCategoria === producto.idCategoria

          );



          return [

            producto.nombre,

            producto.descripcion,

            `Q ${Number(producto.precio).toFixed(2)}`,

            producto.stock,

            categoria ? categoria.nombre : "Sin categoría"

          ];

        }),

        headStyles: {

          fillColor: [37, 99, 235]

        }

      });



      const finalTabla =

        (doc as jsPDF & {

          lastAutoTable?: { finalY: number };

        }).lastAutoTable?.finalY ?? 80;



      doc.setFontSize(14);

      doc.setFont("helvetica", "bold");

      doc.text("Categorías", 14, finalTabla + 12);



      autoTable(doc, {

        startY: finalTabla + 17,

        head: [["Nombre", "Descripción"]],

        body: categorias.map((categoria) => [

          categoria.nombre,

          categoria.descripcion

        ]),

        headStyles: {

          fillColor: [34, 197, 94]

        }

      });



      doc.save("productos-categorias.pdf");

    } catch {

      alert("No se pudo generar el reporte.");

    }

  };



  const exportarFiltrado = async () => {

    try {

      const busqueda = nombre.trim().toLowerCase();



      if (!busqueda) {

        setMensaje("Escriba un nombre para realizar el filtro.");

        return;

      }



      const doc = new jsPDF();



      if (reporteActivo === "categorias") {

        const respuesta = await listarCategoriasActivas();



        const datos = respuesta.data.filter((categoria) =>

          categoria.nombre.toLowerCase().includes(busqueda)

        );



        if (datos.length === 0) {

          setMensaje("No se encontraron categorías.");

          return;

        }



        encabezado(doc, "Reporte de Categorías");



        autoTable(doc, {

          startY: 35,

          head: [["Nombre", "Descripción"]],

          body: datos.map((categoria) => [

            categoria.nombre,

            categoria.descripcion

          ]),

          headStyles: {

            fillColor: [37, 99, 235]

          }

        });



        doc.save("categorias-filtradas.pdf");

      }



      if (reporteActivo === "productos") {

        const respuesta = await listarProductosActivos();



        const datos = respuesta.data.filter((producto) =>

          producto.nombre.toLowerCase().includes(busqueda)

        );



        if (datos.length === 0) {

          setMensaje("No se encontraron productos.");

          return;

        }



        encabezado(doc, "Reporte de Productos");



        autoTable(doc, {

          startY: 35,

          head: [["Producto", "Descripción", "Precio", "Stock"]],

          body: datos.map((producto) => [

            producto.nombre,

            producto.descripcion,

            `Q ${Number(producto.precio).toFixed(2)}`,

            producto.stock

          ]),

          headStyles: {

            fillColor: [37, 99, 235]

          }

        });



        doc.save("productos-filtrados.pdf");

      }



      cerrarReporte();

    } catch {

      setMensaje("No se pudo generar el reporte.");

    }

  };



  return (

    <div className="min-h-screen bg-slate-100/70 px-4 py-8 md:px-6 md:py-10">



      <div className="mx-auto max-w-7xl">
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Centro de documentos</p>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">

        Reportes

      </h2>
      </div>



      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm p-6">



        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">



          <button

            onClick={reporteProductosPDF}

            className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-left font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"

          >

            Reporte Productos PDF

          </button>



          <button

            onClick={reporteCategoriasPDF}

            className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-left font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"

          >

            Reporte Categorías PDF

          </button>



          <button

            onClick={() => abrirReporte("categorias")}

            className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-left font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"

          >

            Filtra Categorías

          </button>



          <button

            onClick={() => abrirReporte("productos")}

            className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-left font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"

          >

            Filtra Productos

          </button>



          <button

            onClick={productosYCategoriasPDF}

            className="rounded-xl bg-emerald-600 px-5 py-4 text-left font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md"

          >

            Productos y Categorías PDF

          </button>



        </div>

      </div>



      {reporteActivo && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">



          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">



            <h3 className="text-xl font-bold text-slate-800 mb-6">

              {tituloModal()}

            </h3>



            <label className="block text-sm font-medium text-slate-700 mb-2">

              Nombre

            </label>



            <input

              type="text"

              value={nombre}

              onChange={(e) => {

                setNombre(e.target.value);

                setMensaje("");

              }}

              onKeyDown={(e) => {

                if (e.key === "Enter") {

                  exportarFiltrado();

                }

              }}

              autoFocus

              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"

            />



            {mensaje && (

              <p className="mt-3 text-sm text-red-600">

                {mensaje}

              </p>

            )}



            <div className="flex justify-end gap-3 mt-6">



              <button

                onClick={cerrarReporte}

                className="rounded-xl bg-slate-100 px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-200"

              >

                Cerrar

              </button>



              <button

                onClick={exportarFiltrado}

                className="rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700"

              >

                Exportar a PDF

              </button>



            </div>



          </div>

        </div>

      )}

      </div>
    </div>

  );

}