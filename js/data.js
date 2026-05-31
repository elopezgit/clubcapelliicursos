/**
 * Club Capelli Cursos - Unified Data Engine (Clean Sheet Source Shell)
 * 
 * Provides the clean, standardized, empty database skeleton for Google Sheets.
 * Starts with 0 registrations, ensuring that only actual data from Google Sheets is displayed.
 */

const CAPELLI_DATABASE = {
    today: new Date("2025-05-30T10:00:00"), // Will be updated dynamically based on real data timestamps
    cursos: [
        { id: 1, nombre: "Curso de Peluquería Profesional", precio: 80000, duracion: "8 meses", sales: 0, revenue: 0, activos: 0, views: 0, rating: 4.8, img: "assets/img/cursos/cursopeluqueria.png" },
        { id: 2, nombre: "Curso de Barbería Clásica", precio: 75000, duracion: "6 meses", sales: 0, revenue: 0, activos: 0, views: 0, rating: 4.7, img: "assets/img/cursos/cursobarberia.png" },
        { id: 3, nombre: "Curso de Manicura Integral", precio: 65000, duracion: "4 meses", sales: 0, revenue: 0, activos: 0, views: 0, rating: 4.6, img: "assets/img/cursos/cursomanicura.png" },
        { id: 4, nombre: "Curso de Maestría en Maquillaje", precio: 90000, duracion: "5 meses", sales: 0, revenue: 0, activos: 0, views: 0, rating: 4.5, img: "assets/img/cursos/cursomaquillaje.png" },
        { id: 5, nombre: "Curso de Especialización de Pestañas y Cejas", precio: 55000, duracion: "3 meses", sales: 0, revenue: 0, activos: 0, views: 0, rating: 4.7, img: "assets/img/cursos/cursopestania.png" },
        { id: 6, nombre: "Curso de Tratamientos Capilares", precio: 70000, duracion: "3 meses", sales: 0, revenue: 0, activos: 0, views: 0, rating: 4.8, img: "assets/img/cursos/cursotratamientocapilar.png" }
    ],
    alumnos: [],
    suscripciones: [],
    ingresos: [],
    actividad: []
};
