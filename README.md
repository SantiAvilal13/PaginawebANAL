# Taller de Análisis de Algoritmos

## Descripción del Proyecto

Este proyecto fue desarrollado como parte del **Taller de la Asignatura de Análisis de Algoritmos**, donde se implementó una aplicación web interactiva para comparar y analizar el rendimiento de diferentes algoritmos clásicos de ciencias de la computación.

## Algoritmos Implementados

La aplicación permite comparar versiones de **fuerza bruta** vs **algoritmos optimizados** para los siguientes problemas:

### 1. 🗺️ Problema del Viajante (TSP)
- **Fuerza Bruta**: Evaluación exhaustiva de todas las permutaciones
- **Optimizado**: Heurística 2-opt con mejoras iterativas
- **Métricas**: Tiempo de ejecución y distancias calculadas
- **Validación**: Limitado a n≤9 para fuerza bruta

### 2. ♛ Problema de las N-Reinas
- **Fuerza Bruta**: Backtracking básico
- **Optimizado**: Uso de sets para columnas y diagonales
- **Métricas**: Tiempo, nodos explorados y número de soluciones
- **Características**: Navegación entre múltiples soluciones

### 3. 🔐 Criptograma
- **Fuerza Bruta**: Backtracking con prueba de todas las asignaciones
- **Optimizado**: Algoritmo con propagación de restricciones y acarreo por columnas
- **Métricas**: Tiempo de ejecución y intentos realizados

### 4. 🔢 Funciones Hash
- **Fuerza Bruta**: Búsqueda lineal
- **Optimizado**: Tabla hash con manejo de colisiones
- **Métricas**: Tiempo y número de intentos
- **Validación**: m≥2, rango aleatorio ajustado a √m

### 5. 🧮 Multiplicación de Matrices
- **Fuerza Bruta**: Algoritmo cúbico tradicional O(n³)
- **Optimizado**: Algoritmo de Strassen O(n^log₂7)
- **Métricas**: Tiempo y número de operaciones
- **Optimización**: Umbral para matrices pequeñas

### 6. 🧩 Sudoku
- **Fuerza Bruta**: Backtracking simple
- **Optimizado**: Forward checking con propagación de restricciones
- **Métricas**: Tiempo y pasos de resolución
- **Características**: Validación 9×9 y visualización resaltada

## Características Técnicas

### 🎯 Sistema de Métricas Unificado
- **Tiempo de ejecución**: Medición precisa en milisegundos
- **Métricas específicas**: Nodos, operaciones, intentos, distancias
- **Formateo automático**: Números grandes con separadores de miles
- **Comentarios interpretativos**: Análisis automático de mejoras de rendimiento

### 📊 Visualización de Datos
- **Gráficos comparativos**: Representación visual del rendimiento
- **Tablas de resultados**: Métricas detalladas lado a lado
- **Interfaz responsiva**: Diseño adaptable a diferentes dispositivos

### 🔧 Validaciones y Controles
- **Límites de entrada**: Validación de parámetros según el algoritmo
- **Manejo de errores**: Retroalimentación clara al usuario
- **Cancelación de procesos**: Interrupción de algoritmos de larga duración

## Tecnologías Utilizadas

- **HTML5**: Estructura semántica de la aplicación
- **CSS3**: Estilos modernos y diseño responsivo
- **JavaScript ES6+**: Lógica de algoritmos y manipulación del DOM
- **Canvas API**: Renderizado de gráficos de rendimiento

## Objetivos Académicos Alcanzados

1. **Análisis de Complejidad**: Comparación práctica entre diferentes enfoques algorítmicos
2. **Optimización**: Implementación de técnicas avanzadas de mejora de rendimiento
3. **Visualización**: Representación gráfica de métricas de rendimiento
4. **Validación Experimental**: Verificación empírica de la teoría de complejidad
5. **Ingeniería de Software**: Desarrollo de una aplicación web completa y funcional

## Estructura del Proyecto

PaginawebANAL/
├── index.html          # Interfaz principal de la aplicación
├── script.js           # Lógica de algoritmos y funcionalidad
├── styles.css          # Estilos y diseño visual
├── proyecto anala.txt  # Documentación de requisitos
└── README.md          # Este archivo

## Cómo Usar la Aplicación

1. Abrir `index.html` en un navegador web moderno
2. Seleccionar el algoritmo a analizar
3. Configurar los parámetros de entrada
4. Ejecutar la comparación entre fuerza bruta y algoritmo optimizado
5. Analizar los resultados y métricas mostradas

## Autor

**Santiago Avila** - Estudiante de Ingenieria de sistemas
**David Piñeros** - Estudiante de Ingenieria de sistemas

---

*Este proyecto demuestra la aplicación práctica de conceptos teóricos de análisis de algoritmos, proporcionando una herramienta interactiva para el estudio comparativo de diferentes enfoques algorítmicos.*
