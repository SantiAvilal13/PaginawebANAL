// Global variables
let currentPage = 'home';
let currentSolutions = {};

// Performance and cancellation system
let algorithmCancelled = false;
let algorithmStartTime = 0;
const MAX_EXECUTION_TIME = 60000; // 60 seconds
const MAX_NODES_BRUTE_FORCE = 5000000; // Maximum nodes for brute force algorithms (increased)

// Unified metrics system
function formatMetrics(result, metricType = 'nodes') {
    if (!result) return '-';
    
    switch (metricType) {
        case 'nodes':
            return result.nodes ? result.nodes.toLocaleString() : '-';
        case 'operations':
            return result.operations ? result.operations.toLocaleString() : '-';
        case 'attempts':
            return result.attempts ? result.attempts.toLocaleString() : '-';
        case 'distance':
            return result.distance ? result.distance.toFixed(2) : '-';
        default:
            return result[metricType] || '-';
    }
}

function generateInterpretiveComment(bruteResult, efficientResult, algorithm, strategy = '') {
    if (!bruteResult || !efficientResult) return 'Comparación incompleta.';
    
    const bruteTime = parseFloat(bruteResult.time) || 0;
    const efficientTime = parseFloat(efficientResult.time) || 0;
    const bruteMetric = bruteResult.result?.nodes || bruteResult.result?.operations || bruteResult.result?.attempts || 0;
    const efficientMetric = efficientResult.result?.nodes || efficientResult.result?.operations || efficientResult.result?.attempts || 0;
    
    let timeImprovement = 0;
    let metricReduction = 0;
    
    if (bruteTime > 0) {
        timeImprovement = ((bruteTime - efficientTime) / bruteTime * 100);
    }
    
    if (bruteMetric > 0) {
        metricReduction = ((bruteMetric - efficientMetric) / bruteMetric * 100);
    }
    
    // Algorithm-specific comments
    let comment = '';
    const strategyText = strategy ? ` usando estrategia ${strategy.toUpperCase()}` : '';
    
    switch (algorithm) {
        case 'tsp':
            if (timeImprovement > 0) {
                comment = `El algoritmo Nearest Neighbor fue ${timeImprovement.toFixed(1)}% más rápido`;
                if (metricReduction > 0) {
                    comment += ` y exploró ${metricReduction.toFixed(1)}% menos nodos que la fuerza bruta.`;
                } else {
                    comment += ' que la fuerza bruta.';
                }
            } else {
                comment = 'El algoritmo heurístico mostró un rendimiento comparable a la fuerza bruta.';
            }
            break;
            
        case 'nqueens':
            if (metricReduction > 0) {
                comment = `El algoritmo eficiente exploró ${metricReduction.toFixed(1)}% menos nodos que la fuerza bruta${strategyText}.`;
                if (timeImprovement > 50) {
                    comment += ` La optimización con sets resultó en una mejora significativa del ${timeImprovement.toFixed(1)}% en tiempo.`;
                }
            } else {
                comment = `Ambos algoritmos exploraron un número similar de nodos${strategyText}.`;
            }
            break;
            
        case 'hash':
            if (metricReduction > 0) {
                comment = `El algoritmo aleatorio requirió ${metricReduction.toFixed(1)}% menos intentos que el secuencial.`;
                if (timeImprovement > 0) {
                    comment += ` El enfoque probabilístico fue ${timeImprovement.toFixed(1)}% más rápido.`;
                }
            } else {
                comment = 'Ambos algoritmos mostraron un rendimiento similar para este tamaño de tabla.';
            }
            break;
            
        case 'matrix':
            if (metricReduction > 0) {
                comment = `Strassen redujo las operaciones en ${metricReduction.toFixed(1)}% comparado con el algoritmo por bloques.`;
                if (timeImprovement > 0) {
                    comment += ` La mejora en tiempo fue del ${timeImprovement.toFixed(1)}%.`;
                } else if (timeImprovement < -10) {
                    comment += ` Sin embargo, el overhead de Strassen resultó en ${Math.abs(timeImprovement).toFixed(1)}% más tiempo para esta matriz.`;
                }
            } else {
                comment = 'Para matrices de este tamaño, ambos algoritmos tienen complejidad similar.';
            }
            break;
            
        case 'sudoku':
            if (metricReduction > 0) {
                comment = `Forward checking redujo la exploración en ${metricReduction.toFixed(1)}% comparado con backtracking básico${strategyText}.`;
                if (metricReduction > 80) {
                    comment += ' La detección temprana de fallos fue muy efectiva.';
                }
            } else {
                comment = `Ambos algoritmos exploraron un número similar de nodos${strategyText}.`;
            }
            break;
            
        case 'cryptogram':
            if (metricReduction > 0) {
                comment = `El algoritmo con acarreo por columnas redujo los intentos en ${metricReduction.toFixed(1)}% comparado con backtracking por letras.`;
                if (timeImprovement > 0) {
                    comment += ` La optimización resultó en ${timeImprovement.toFixed(1)}% menos tiempo de ejecución.`;
                }
            } else {
                comment = 'Ambos algoritmos mostraron eficiencia similar para este criptograma.';
            }
            break;
            
        default:
            comment = `El algoritmo eficiente mostró una mejora del ${timeImprovement.toFixed(1)}% en tiempo y ${metricReduction.toFixed(1)}% en exploración.`;
    }
    
    return comment;
}

function resetCancellation() {
    algorithmCancelled = false;
    algorithmStartTime = Date.now();
}

function checkCancellation(nodes = 0, problemType = 'default') {
    const elapsed = Date.now() - algorithmStartTime;
    
    // Check time limit
    if (elapsed > MAX_EXECUTION_TIME) {
        algorithmCancelled = true;
        throw new Error(`Algoritmo cancelado: excedió el límite de tiempo de ${MAX_EXECUTION_TIME/1000} segundos`);
    }
    
    // Different node limits for different problem types
    let nodeLimit = MAX_NODES_BRUTE_FORCE;
    if (problemType === 'tsp') {
        nodeLimit = 500000; // TSP can be very expensive
    } else if (problemType === 'nqueens') {
        nodeLimit = 10000000; // N-Queens needs more exploration
    } else if (problemType === 'sudoku') {
        nodeLimit = 10000000; // Sudoku can need many steps
    } else if (problemType === 'cryptogram') {
        nodeLimit = 50000000; // Cryptogram has many combinations
    }
    
    // Check node limit for brute force
    if (nodes > nodeLimit) {
        algorithmCancelled = true;
        throw new Error(`Algoritmo cancelado: excedió el límite de ${nodeLimit.toLocaleString()} nodos explorados`);
    }
    
    return !algorithmCancelled;
}

function createCancellableExecution(algorithmFn, problemId) {
    return new Promise((resolve, reject) => {
        resetCancellation();
        
        // Add cancel button to UI
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancelar';
        cancelBtn.className = 'cancel-btn';
        cancelBtn.onclick = () => {
            algorithmCancelled = true;
            cancelBtn.remove();
            reject(new Error('Algoritmo cancelado por el usuario'));
        };
        
        const statusElement = document.getElementById(problemId + 'Status');
        if (statusElement) {
            statusElement.appendChild(cancelBtn);
        }
        
        // Execute algorithm asynchronously to allow cancellation
        setTimeout(() => {
            try {
                const start = performance.now();
                const result = algorithmFn();
                const end = performance.now();
                
                if (!algorithmCancelled) {
                    cancelBtn.remove();
                    resolve({
                        result: result,
                        time: (end - start).toFixed(2)
                    });
                }
            } catch (error) {
                cancelBtn.remove();
                if (error.message.includes('cancelado')) {
                    reject(error);
                } else {
                    reject(new Error(`Error en algoritmo: ${error.message}`));
                }
            }
        }, 10); // Small delay to allow UI update
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadDemoData();
});

function initializeApp() {
    // Navigation setup
    document.getElementById('homeBtn').addEventListener('click', () => showPage('home'));
    
    // Problem card navigation
    document.querySelectorAll('.problem-card').forEach(card => {
        card.addEventListener('click', function() {
            const problem = this.dataset.problem;
            showPage(problem);
            loadProblemDemo(problem);
            executeAutoComparison(problem);
        });
    });
    
    // Setup all problem event listeners
    setupTSPEvents();
    setupNQueensEvents();
    setupHashEvents();
    setupMatrixEvents();
    setupSudokuEvents();
    setupCryptogramEvents();
    
    // Setup code tabs functionality
    setupCodeTabs();
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = pageId === 'home' ? 'homePage' : pageId + 'Page';
    document.getElementById(targetPage).classList.add('active');
    currentPage = pageId;
}

function loadDemoData() {
    // TSP demo data
    document.getElementById('tspInput').value = '0,0;1,0;1,1;0,1;0.5,0.5';
    
    // N-Queens demo data
    document.getElementById('nqueensInput').value = '8';
    
    // Hash demo data
    document.getElementById('hashModulus').value = '97';
    document.getElementById('hashLimit').value = '200';
    
    // Matrix demo data
    document.getElementById('matrixA').value = '1,2,3;4,5,6;7,8,9';
    document.getElementById('matrixB').value = '1,0,0;0,1,0;0,0,1';
    
    // Sudoku demo data
    document.getElementById('sudokuInput').value = '530070000;600195000;098000060;800060003;400803001;700020006;060000280;000419005;000080079';
}

function loadProblemDemo(problem) {
    // Load demo data is already called in loadDemoData()
    // This function can be used for problem-specific initialization
    if (problem === 'tsp') {
        drawTSPVisualization();
    } else if (problem === 'hash') {
        drawHashVisualization();
    } else if (problem === 'matrix') {
        drawMatrixVisualization();
    } else if (problem === 'cryptogram') {
        drawCryptogramVisualization();
    }
}

function executeAutoComparison(problem) {
    // Auto-execute comparison when opening a problem
    setTimeout(() => {
        const compareBtn = document.getElementById(problem + 'CompareBtn');
        if (compareBtn) {
            compareBtn.click();
        }
    }, 500);
}

// Status message functions
function showStatus(problemId, message, type = 'loading') {
    const statusElement = document.getElementById(problemId + 'Status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-message ${type}`;
    }
}

function clearStatus(problemId) {
    const statusElement = document.getElementById(problemId + 'Status');
    if (statusElement) {
        statusElement.textContent = '';
        statusElement.className = 'status-message';
    }
}

// Utility functions
function measureTime(func) {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    return {
        result: result,
        time: (end - start).toFixed(2)
    };
}

function parseCoordinates(input) {
    return input.split(';').map(coord => {
        const [x, y] = coord.split(',').map(Number);
        return [x, y];
    });
}

function parseMatrix(input) {
    // Handle both formats: '1,2;3,4' and '[[1,2],[3,4]]'
    if (input.trim().startsWith('[[')) {
        // Parse array format: [[1,2],[3,4]]
        try {
            return JSON.parse(input);
        } catch (e) {
            throw new Error('Invalid array format');
        }
    } else {
        // Parse semicolon format: 1,2;3,4
        return input.split(';').map(row => row.split(',').map(Number));
    }
}

function parseSudoku(input) {
    return input.split(';').map(row => row.split('').map(Number));
}

function formatMatrix(matrix) {
    return matrix.map(row => '[' + row.join(',') + ']').join('\n');
}

function drawChart(canvasId, data, labels) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with id '${canvasId}' not found`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Find max value for scaling - handle edge cases
    let maxValue = Math.max(...data);
    if (maxValue === 0) {
        maxValue = 1; // Avoid division by zero
    } else {
        maxValue = maxValue * 1.1; // Add 10% padding
    }
    
    // Draw bars
    const barWidth = chartWidth / (data.length * 2);
    const colors = ['#ff6b6b', '#26de81'];
    
    data.forEach((value, index) => {
        const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
        const x = padding + index * barWidth * 2 + barWidth * 0.5;
        const y = canvas.height - padding - barHeight;
        
        // Draw bar
        ctx.fillStyle = colors[index];
        ctx.fillRect(x, y, barWidth, Math.max(barHeight, 1)); // Minimum height of 1px
        
        // Draw value on top
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(value.toString(), x + barWidth/2, y - 5);
        
        // Draw label
        ctx.fillText(labels[index], x + barWidth/2, canvas.height - padding + 20);
    });
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
}

// TSP Visualization
function drawTSPVisualization() {
    const canvas = document.getElementById('tspVisualization');
    const ctx = canvas.getContext('2d');
    const input = document.getElementById('tspInput').value;
    const coords = parseCoordinates(input);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Scale coordinates to fit canvas
    const padding = 40;
    const maxX = Math.max(...coords.map(c => c[0]));
    const maxY = Math.max(...coords.map(c => c[1]));
    const minX = Math.min(...coords.map(c => c[0]));
    const minY = Math.min(...coords.map(c => c[1]));
    
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX || 1);
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);
    
    // Draw cities
    ctx.fillStyle = '#007bff';
    coords.forEach((coord, index) => {
        const x = padding + (coord[0] - minX) * scale;
        const y = padding + (coord[1] - minY) * scale;
        
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw city label
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(index.toString(), x, y - 15);
        ctx.fillStyle = '#007bff';
    });
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Problema del Viajante (TSP)', canvas.width / 2, 25);
    ctx.fillText(`${coords.length} ciudades`, canvas.width / 2, canvas.height - 10);
}

// TSP Implementation
function setupTSPEvents() {
    document.getElementById('tspBruteBtn').addEventListener('click', () => executeTSP('brute'));
    document.getElementById('tspEfficientBtn').addEventListener('click', () => executeTSP('efficient'));
    document.getElementById('tspCompareBtn').addEventListener('click', () => compareTSP());
}

function executeTSP(method) {
    const input = document.getElementById('tspInput').value;
    const validation = validateTSPInput(input);
    
    if (!validation.valid) {
        showValidationError('tsp', validation.error);
        return;
    }
    
    const coords = validation.coords;
    
    if (method === 'brute' && coords.length > 9) {
        showValidationError('tsp', 'Fuerza bruta limitada a 9 ciudades máximo para evitar tiempos excesivos');
        return;
    }
    
    const algorithmName = method === 'brute' ? 'de fuerza bruta' : 'eficiente';
    const algorithm = method === 'brute' ? () => tspBruteForce(coords) : () => tspNearestNeighbor(coords);
    
    showStatus('tsp', `Ejecutando algoritmo TSP ${algorithmName}...`, 'info');
    
    createCancellableExecution(
        algorithm,
        'tsp'
    ).then(result => {
        if (result.cancelled) {
            showStatus('tsp', 'Algoritmo cancelado por el usuario', 'error');
            return;
        }
        
        if (result.timeout) {
            showStatus('tsp', 'Algoritmo cancelado por límite de tiempo', 'error');
            return;
        }
        
        // Check if result is valid
        if (!result.result) {
            showStatus('tsp', 'Error: Algoritmo no completado correctamente', 'error');
            return;
        }
        
        // Update UI
        document.getElementById(`tsp${method === 'brute' ? 'Brute' : 'Efficient'}Time`).textContent = result.time + ' ms';
        document.getElementById(`tsp${method === 'brute' ? 'Brute' : 'Efficient'}Nodes`).textContent = result.result.nodes || 0;
        document.getElementById(`tsp${method === 'brute' ? 'Brute' : 'Efficient'}Result`).textContent = 
            result.result.path ? `Ruta: [${result.result.path.join(',')}], Distancia: ${result.result.distance.toFixed(2)}` : 'No se encontró solución';
        
        showStatus('tsp', `Algoritmo ${algorithmName} completado exitosamente`, 'success');
        
        // Draw solution on visualization
        if (result.result.path) {
            drawTSPSolution(result.result.path, coords);
        }
    }).catch(error => {
        showStatus('tsp', `Error en algoritmo: ${error.message}`, 'error');
    });
}

function drawTSPSolution(path, coords) {
    const canvas = document.getElementById('tspVisualization');
    const ctx = canvas.getContext('2d');
    
    // Redraw base visualization
    drawTSPVisualization();
    
    // Scale coordinates
    const padding = 40;
    const maxX = Math.max(...coords.map(c => c[0]));
    const maxY = Math.max(...coords.map(c => c[1]));
    const minX = Math.min(...coords.map(c => c[0]));
    const minY = Math.min(...coords.map(c => c[1]));
    
    const scaleX = (canvas.width - 2 * padding) / (maxX - minX || 1);
    const scaleY = (canvas.height - 2 * padding) / (maxY - minY || 1);
    const scale = Math.min(scaleX, scaleY);
    
    // Draw path
    ctx.strokeStyle = '#28a745';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < path.length; i++) {
        const cityIndex = path[i];
        const coord = coords[cityIndex];
        const x = padding + (coord[0] - minX) * scale;
        const y = padding + (coord[1] - minY) * scale;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    // Close the path
    const firstCity = coords[path[0]];
    const firstX = padding + (firstCity[0] - minX) * scale;
    const firstY = padding + (firstCity[1] - minY) * scale;
    ctx.lineTo(firstX, firstY);
    ctx.stroke();
}

function tspBruteForce(coords) {
    let distanceCalculations = 0;
    let bestDistance = Infinity;
    let bestPath = [];
    
    function distance(p1, p2) {
        distanceCalculations++;
        return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
    }
    
    function permute(arr, start = 0) {
        // Check for cancellation every 1000 distance calculations
        if (distanceCalculations % 1000 === 0) {
            checkCancellation(distanceCalculations, 'tsp');
        }
        
        if (start === arr.length - 1) {
            // Calculate tour distance: 0 -> arr[0] -> arr[1] -> ... -> arr[last] -> 0
            let totalDistance = distance(coords[0], coords[arr[0]]); // 0 to first city
            for (let i = 0; i < arr.length - 1; i++) {
                totalDistance += distance(coords[arr[i]], coords[arr[i + 1]]);
            }
            totalDistance += distance(coords[arr[arr.length - 1]], coords[0]); // last city back to 0
            
            if (totalDistance < bestDistance) {
                bestDistance = totalDistance;
                bestPath = [...arr];
            }
            return;
        }
        
        for (let i = start; i < arr.length; i++) {
            [arr[start], arr[i]] = [arr[i], arr[start]];
            permute(arr, start + 1);
            [arr[start], arr[i]] = [arr[i], arr[start]];
        }
    }
    
    const cities = Array.from({length: coords.length - 1}, (_, i) => i + 1); // Cities 1 to n-1
    permute(cities); // Permute cities excluding 0
    
    return {
        path: [0, ...bestPath, 0], // Closed tour
        distance: bestDistance,
        nodes: distanceCalculations
    };
}

function tspNearestNeighbor(coords) {
    let distanceCalculations = 0;
    
    function distance(p1, p2) {
        distanceCalculations++;
        return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
    }
    
    // Phase 1: Nearest Neighbor construction
    const visited = new Array(coords.length).fill(false);
    const path = [0];
    visited[0] = true;
    let totalDistance = 0;
    
    let current = 0;
    for (let i = 1; i < coords.length; i++) {
        let nearest = -1;
        let nearestDistance = Infinity;
        
        for (let j = 0; j < coords.length; j++) {
            if (!visited[j]) {
                const dist = distance(coords[current], coords[j]);
                if (dist < nearestDistance) {
                    nearestDistance = dist;
                    nearest = j;
                }
            }
        }
        
        visited[nearest] = true;
        path.push(nearest);
        totalDistance += nearestDistance;
        current = nearest;
    }
    
    // Return to start
    totalDistance += distance(coords[current], coords[0]);
    path.push(0); // Close the tour
    
    // Phase 2: 2-opt improvement
    let improved = true;
    let iterations = 0;
    const maxIterations = 100; // Limit iterations to prevent excessive computation
    
    while (improved && iterations < maxIterations) {
        improved = false;
        iterations++;
        
        for (let i = 1; i < path.length - 2; i++) {
            for (let j = i + 1; j < path.length - 1; j++) {
                // Calculate current distance
                const currentDist = distance(coords[path[i-1]], coords[path[i]]) + 
                                  distance(coords[path[j]], coords[path[j+1]]);
                
                // Calculate distance after 2-opt swap
                const newDist = distance(coords[path[i-1]], coords[path[j]]) + 
                              distance(coords[path[i]], coords[path[j+1]]);
                
                if (newDist < currentDist) {
                    // Perform 2-opt swap: reverse the segment between i and j
                    const newPath = [...path];
                    for (let k = 0; k <= j - i; k++) {
                        newPath[i + k] = path[j - k];
                    }
                    path.splice(0, path.length, ...newPath);
                    
                    // Recalculate total distance
                    totalDistance = 0;
                    for (let k = 0; k < path.length - 1; k++) {
                        totalDistance += distance(coords[path[k]], coords[path[k + 1]]);
                    }
                    
                    improved = true;
                    break;
                }
            }
            if (improved) break;
        }
    }
    
    return {
        path: path,
        distance: totalDistance,
        nodes: distanceCalculations
    };
}

function compareTSP() {
    const input = document.getElementById('tspInput').value;
    const coords = parseCoordinates(input);
    
    if (coords.length > 9) {
        showStatus('tsp', 'Error: Comparación limitada a 9 ciudades máximo para fuerza bruta', 'error');
        return;
    }
    
    showStatus('tsp', 'Ejecutando comparación de algoritmos...', 'loading');
    
    setTimeout(() => {
        try {
            const bruteResult = measureTime(() => tspBruteForce(coords));
            const efficientResult = measureTime(() => tspNearestNeighbor(coords));
            
            // Check if results are valid
            if (!bruteResult.result || !efficientResult.result) {
                showStatus('tsp', 'Error: Algoritmos no completados correctamente', 'error');
                return;
            }
            
            // Update UI with unified metrics
            document.getElementById('tspBruteTime').textContent = bruteResult.time + ' ms';
            document.getElementById('tspBruteNodes').textContent = formatMetrics(bruteResult.result, 'nodes');
            document.getElementById('tspBruteResult').textContent = 
                `Ruta: [${bruteResult.result.path ? bruteResult.result.path.join(',') : 'N/A'}], Distancia: ${formatMetrics(bruteResult.result, 'distance')}`;
            
            document.getElementById('tspEfficientTime').textContent = efficientResult.time + ' ms';
            document.getElementById('tspEfficientNodes').textContent = formatMetrics(efficientResult.result, 'nodes');
            document.getElementById('tspEfficientResult').textContent = 
                `Ruta: [${efficientResult.result.path ? efficientResult.result.path.join(',') : 'N/A'}], Distancia: ${formatMetrics(efficientResult.result, 'distance')}`;
            
            // Draw charts
            drawChart('tspChartTime', [parseFloat(bruteResult.time), parseFloat(efficientResult.time)], ['Fuerza Bruta', 'Eficiente']);
            drawChart('tspChartNodes', [bruteResult.result.nodes || 0, efficientResult.result.nodes || 0], ['Fuerza Bruta', 'Eficiente']);
            
            // Generate interpretive comment
            document.getElementById('tspComment').textContent = generateInterpretiveComment(bruteResult, efficientResult, 'tsp');
            
            showStatus('tsp', 'Comparación completada exitosamente', 'success');
            
            // Draw best solution
            if (bruteResult.result.path) {
                drawTSPSolution(bruteResult.result.path, coords);
            }
        } catch (error) {
            showStatus('tsp', `Error en comparación: ${error.message}`, 'error');
        }
    }, 100);
}

// Hash Collision Visualization
function drawHashVisualization() {
    const canvas = document.getElementById('hashVisualization');
    const ctx = canvas.getContext('2d');
    const m = parseInt(document.getElementById('hashModulus').value);
    const limit = parseInt(document.getElementById('hashLimit').value);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw hash table visualization
    const cellWidth = Math.min(canvas.width / Math.min(m, 10), 40);
    const cellHeight = 30;
    const startX = (canvas.width - cellWidth * Math.min(m, 10)) / 2;
    const startY = 50;
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Detección de Colisiones Hash', canvas.width / 2, 25);
    ctx.fillText(`Módulo: ${m}, Límite: ${limit}`, canvas.width / 2, canvas.height - 10);
    
    // Draw hash table slots
    for (let i = 0; i < Math.min(m, 10); i++) {
        const x = startX + i * cellWidth;
        const y = startY;
        
        // Draw slot
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, cellWidth, cellHeight);
        
        // Draw slot number
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), x + cellWidth/2, y + cellHeight/2 + 4);
    }
    
    if (m > 10) {
        ctx.fillText('...', startX + 10 * cellWidth + 20, startY + cellHeight/2 + 4);
    }
    
    // Draw example values
    ctx.fillStyle = '#28a745';
    ctx.font = '10px Arial';
    for (let i = 0; i < Math.min(5, limit); i++) {
        const hash = i % m;
        if (hash < 10) {
            const x = startX + hash * cellWidth;
            const y = startY + cellHeight + 10 + i * 15;
            ctx.fillText(`${i} → ${hash}`, x + cellWidth/2, y);
        }
    }
}

// N-Queens Implementation
function setupNQueensEvents() {
    document.getElementById('nqueensBruteBtn').addEventListener('click', () => executeNQueens('brute'));
    document.getElementById('nqueensEfficientBtn').addEventListener('click', () => executeNQueens('efficient'));
    document.getElementById('nqueensCompareBtn').addEventListener('click', () => compareNQueens());
    document.getElementById('nqueens4Btn').addEventListener('click', () => {
        document.getElementById('nqueensInput').value = '4';
    });
    document.getElementById('nextSolutionBtn').addEventListener('click', () => showNextSolution());
}

function executeNQueens(method) {
    const nInput = document.getElementById('nqueensInput').value;
    const strategy = document.getElementById('nqueensStrategy').value;
    const searchType = document.getElementById('nqueensSearchType').value;
    
    const validation = validateNQueensInput(nInput);
    
    if (!validation.valid) {
        showValidationError('nqueens', validation.error);
        return;
    }
    
    const n = validation.n;
    
    const algorithmName = method === 'brute' ? 'de fuerza bruta' : 'eficiente';
    const algorithm = method === 'brute' ? () => nqueensBruteForce(n, strategy, searchType) : () => nqueensEfficient(n, strategy, searchType);
    
    showStatus('nqueens', `Ejecutando algoritmo N-Queens ${algorithmName}...`, 'info');
    
    createCancellableExecution(
        algorithm,
        'nqueens'
    ).then(result => {
        if (result.cancelled) {
            showStatus('nqueens', 'Algoritmo cancelado por el usuario', 'error');
            return;
        }
        
        if (result.timeout) {
            showStatus('nqueens', 'Algoritmo cancelado por límite de tiempo', 'error');
            return;
        }
        
        // Check if result is valid
        if (!result.result) {
            showStatus('nqueens', 'Error: Algoritmo no completado correctamente', 'error');
            return;
        }
        
        // Store solutions for visualization
        currentSolutions.nqueens = result.result.solutions || [];
        currentSolutions.nqueensIndex = 0;
        
        // Update UI
        document.getElementById(`nqueens${method === 'brute' ? 'Brute' : 'Efficient'}Time`).textContent = result.time + ' ms';
        document.getElementById(`nqueens${method === 'brute' ? 'Brute' : 'Efficient'}Nodes`).textContent = result.result.nodes || 0;
        document.getElementById(`nqueens${method === 'brute' ? 'Brute' : 'Efficient'}Result`).textContent = 
            `${(result.result.solutions || []).length} soluciones encontradas`;
        
        // Draw board
        if ((result.result.solutions || []).length > 0) {
            drawNQueensBoard(result.result.solutions[0], n);
            updateSolutionCounter();
        }
        
        showStatus('nqueens', `Algoritmo ${algorithmName} completado exitosamente`, 'success');
    }).catch(error => {
        showStatus('nqueens', `Error en algoritmo: ${error.message}`, 'error');
    });
}

function nqueensBruteForce(n, strategy, searchType = 'dfs') {
    let nodes = 0;
    const solutions = [];
    
    function isValid(board, row, col) {
        // Check column
        for (let i = 0; i < row; i++) {
            if (board[i] === col) return false;
        }
        
        // Check diagonals
        for (let i = 0; i < row; i++) {
            if (Math.abs(board[i] - col) === Math.abs(i - row)) return false;
        }
        
        return true;
    }
    
    function getColumnOrder(n, strategy) {
        if (strategy === 'centered') {
            // Try center columns first, then work outward
            const order = [];
            const center = Math.floor(n / 2);
            order.push(center);
            for (let i = 1; i <= center; i++) {
                if (center + i < n) order.push(center + i);
                if (center - i >= 0) order.push(center - i);
            }
            return order;
        }
        // Natural order
        return Array.from({length: n}, (_, i) => i);
    }
    
    if (searchType === 'bfs') {
        // BFS implementation using queue
        const queue = [{board: new Array(n).fill(-1), row: 0}];
        
        while (queue.length > 0) {
            nodes++;
            
            // Check for cancellation every 1000 nodes
            if (nodes % 1000 === 0) {
                checkCancellation(nodes, 'nqueens');
            }
            
            const {board, row} = queue.shift();
            
            if (row === n) {
                solutions.push([...board]);
                continue;
            }
            
            const columnOrder = getColumnOrder(n, strategy);
            for (let col of columnOrder) {
                if (isValid(board, row, col)) {
                    const newBoard = [...board];
                    newBoard[row] = col;
                    queue.push({board: newBoard, row: row + 1});
                }
            }
        }
    } else {
        // DFS implementation (recursive)
        function solve(board, row) {
            nodes++;
            
            // Check for cancellation every 1000 nodes
            if (nodes % 1000 === 0) {
                checkCancellation(nodes, 'nqueens');
            }
            
            if (row === n) {
                solutions.push([...board]);
                return;
            }
            
            const columnOrder = getColumnOrder(n, strategy);
            for (let col of columnOrder) {
                if (isValid(board, row, col)) {
                    board[row] = col;
                    solve(board, row + 1);
                    board[row] = -1;
                }
            }
        }
        
        const board = new Array(n).fill(-1);
        solve(board, 0);
    }
    
    return {
        solutions: solutions,
        nodes: nodes
    };
}

function nqueensEfficient(n, strategy, searchType = 'dfs') {
    let nodes = 0;
    const solutions = [];
    
    // Use sets for efficient pruning
    const cols = new Set();
    const diag1 = new Set(); // row - col
    const diag2 = new Set(); // row + col
    
    function getColumnOrder(n, strategy) {
        if (strategy === 'centered') {
            // Try center columns first, then work outward
            const order = [];
            const center = Math.floor(n / 2);
            order.push(center);
            for (let i = 1; i <= center; i++) {
                if (center + i < n) order.push(center + i);
                if (center - i >= 0) order.push(center - i);
            }
            return order;
        }
        // Natural order
        return Array.from({length: n}, (_, i) => i);
    }
    
    if (searchType === 'bfs') {
        // BFS implementation using queue
        const queue = [{
            board: new Array(n).fill(-1),
            row: 0,
            cols: new Set(),
            diag1: new Set(),
            diag2: new Set()
        }];
        
        while (queue.length > 0) {
            nodes++;
            
            const {board, row, cols: currentCols, diag1: currentDiag1, diag2: currentDiag2} = queue.shift();
            
            if (row === n) {
                solutions.push([...board]);
                continue;
            }
            
            const columnOrder = getColumnOrder(n, strategy);
            for (const col of columnOrder) {
                if (!currentCols.has(col) && !currentDiag1.has(row - col) && !currentDiag2.has(row + col)) {
                    const newBoard = [...board];
                    newBoard[row] = col;
                    
                    const newCols = new Set(currentCols);
                    const newDiag1 = new Set(currentDiag1);
                    const newDiag2 = new Set(currentDiag2);
                    
                    newCols.add(col);
                    newDiag1.add(row - col);
                    newDiag2.add(row + col);
                    
                    queue.push({
                        board: newBoard,
                        row: row + 1,
                        cols: newCols,
                        diag1: newDiag1,
                        diag2: newDiag2
                    });
                }
            }
        }
    } else {
        // DFS implementation (recursive)
        function solve(board, row) {
            nodes++;
            if (row === n) {
                solutions.push([...board]);
                return;
            }
            
            // Use strategy-based column ordering
            const columnOrder = getColumnOrder(n, strategy);
            
            for (const col of columnOrder) {
                // Check if position is safe using sets (O(1) lookup)
                if (!cols.has(col) && !diag1.has(row - col) && !diag2.has(row + col)) {
                    // Place queen
                    board[row] = col;
                    cols.add(col);
                    diag1.add(row - col);
                    diag2.add(row + col);
                    
                    solve(board, row + 1);
                    
                    // Backtrack
                    board[row] = -1;
                    cols.delete(col);
                    diag1.delete(row - col);
                    diag2.delete(row + col);
                }
            }
        }
        
        const board = new Array(n).fill(-1);
        solve(board, 0);
    }
    
    return {
        solutions: solutions,
        nodes: nodes
    };
}

function drawNQueensBoard(solution, n) {
    const canvas = document.getElementById('nqueensBoard');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const cellSize = canvas.width / n;
    
    // Draw board
    for (let row = 0; row < n; row++) {
        for (let col = 0; col < n; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#f0d9b5' : '#b58863';
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }
    
    // Draw queens
    ctx.fillStyle = '#000';
    ctx.font = `${cellSize * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let row = 0; row < n; row++) {
        const col = solution[row];
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        ctx.fillText('♛', x, y);
    }
    
    // Update coordinates
    const coordinates = solution.map((col, row) => `(${row},${col})`).join(', ');
    document.getElementById('nqueensCoordinates').textContent = `Coordenadas: ${coordinates}`;
}

function showNextSolution() {
    if (!currentSolutions.nqueens || currentSolutions.nqueens.length === 0) return;
    
    currentSolutions.nqueensIndex = (currentSolutions.nqueensIndex + 1) % currentSolutions.nqueens.length;
    const n = parseInt(document.getElementById('nqueensInput').value);
    drawNQueensBoard(currentSolutions.nqueens[currentSolutions.nqueensIndex], n);
    updateSolutionCounter();
}

function updateSolutionCounter() {
    if (!currentSolutions.nqueens) return;
    
    const current = currentSolutions.nqueensIndex + 1;
    const total = currentSolutions.nqueens.length;
    document.getElementById('solutionCounter').textContent = `Solución ${current} de ${total}`;
}

function compareNQueens() {
    const n = parseInt(document.getElementById('nqueensInput').value);
    const strategy = document.getElementById('nqueensStrategy').value;
    
    if (n < 4) {
        showStatus('nqueens', 'Error: N debe ser al menos 4', 'error');
        return;
    }
    
    showStatus('nqueens', 'Ejecutando comparación de algoritmos...', 'loading');
    
    setTimeout(() => {
        try {
            const bruteResult = measureTime(() => nqueensBruteForce(n, strategy));
            const efficientResult = measureTime(() => nqueensEfficient(n, strategy));
            
            // Check if results are valid
            if (!bruteResult.result || !efficientResult.result) {
                showStatus('nqueens', 'Error: Algoritmos no completados correctamente', 'error');
                return;
            }
            
            // Store solutions
            currentSolutions.nqueens = bruteResult.result.solutions || [];
            currentSolutions.nqueensIndex = 0;
            
            // Update UI with unified metrics
            document.getElementById('nqueensBruteTime').textContent = bruteResult.time + ' ms';
            document.getElementById('nqueensBruteNodes').textContent = formatMetrics(bruteResult.result, 'nodes');
            document.getElementById('nqueensBruteResult').textContent = 
                `${bruteResult.result.solutions ? bruteResult.result.solutions.length : 0} soluciones encontradas`;
            
            document.getElementById('nqueensEfficientTime').textContent = efficientResult.time + ' ms';
            document.getElementById('nqueensEfficientNodes').textContent = formatMetrics(efficientResult.result, 'nodes');
            document.getElementById('nqueensEfficientResult').textContent = 
                `${efficientResult.result.solutions ? efficientResult.result.solutions.length : 0} soluciones encontradas`;
            
            // Draw board
            if (bruteResult.result.solutions && bruteResult.result.solutions.length > 0) {
                drawNQueensBoard(bruteResult.result.solutions[0], n);
                updateSolutionCounter();
            }
            
            // Draw charts
            drawChart('nqueensChartTime', [parseFloat(bruteResult.time), parseFloat(efficientResult.time)], ['Fuerza Bruta', 'Eficiente']);
            drawChart('nqueensChartNodes', [bruteResult.result.nodes || 0, efficientResult.result.nodes || 0], ['Fuerza Bruta', 'Eficiente']);
            
            // Generate interpretive comment
            document.getElementById('nqueensComment').textContent = generateInterpretiveComment(bruteResult, efficientResult, 'nqueens');
            
            showStatus('nqueens', 'Comparación completada exitosamente', 'success');
        } catch (error) {
            showStatus('nqueens', `Error en comparación: ${error.message}`, 'error');
        }
    }, 100);
}

// Hash Collision Implementation
function setupHashEvents() {
    document.getElementById('hashBruteBtn').addEventListener('click', () => executeHash('brute'));
    document.getElementById('hashEfficientBtn').addEventListener('click', () => executeHash('efficient'));
    document.getElementById('hashCompareBtn').addEventListener('click', () => compareHash());
}

function executeHash(method) {
    const mInput = document.getElementById('hashModulus').value;
    const limitInput = document.getElementById('hashLimit').value;
    
    const validation = validateHashInput(mInput, limitInput);
    
    if (!validation.valid) {
        showValidationError('hash', validation.error);
        return;
    }
    
    const m = validation.m;
    const limit = validation.limit;
    
    const algorithmName = method === 'brute' ? 'secuencial' : 'aleatorio';
    const algorithm = method === 'brute' ? () => hashBruteForce(m, limit) : () => hashEfficient(m, limit);
    
    showStatus('hash', `Ejecutando algoritmo Hash ${algorithmName}...`, 'info');
    
    createCancellableExecution(
        algorithm,
        'hash'
    ).then(result => {
        if (result.cancelled) {
            showStatus('hash', 'Algoritmo cancelado por el usuario', 'error');
            return;
        }
        
        if (result.timeout) {
            showStatus('hash', 'Algoritmo cancelado por límite de tiempo', 'error');
            return;
        }
        
        // Check if result is valid
        if (!result.result) {
            showStatus('hash', 'Error: Algoritmo no completado correctamente', 'error');
            return;
        }
        
        // Update UI
        document.getElementById(`hash${method === 'brute' ? 'Brute' : 'Efficient'}Time`).textContent = result.time + ' ms';
        document.getElementById(`hash${method === 'brute' ? 'Brute' : 'Efficient'}Nodes`).textContent = result.result.attempts || 0;
        document.getElementById(`hash${method === 'brute' ? 'Brute' : 'Efficient'}Result`).textContent = 
            result.result.collision ? `Colisión: ${result.result.collision.x} y ${result.result.collision.y} → ${result.result.collision.hash}` : 'No se encontró colisión';
        
        showStatus('hash', `Algoritmo ${algorithmName} completado exitosamente`, 'success');
        
        // Update visualization with collision if found
        if (result.result.collision) {
            drawHashCollision(result.result.collision, m);
        }
    }).catch(error => {
        showStatus('hash', `Error en algoritmo: ${error.message}`, 'error');
    });
}

function hashBruteForce(m, limit) {
    const seen = new Map();
    let attempts = 0;
    
    for (let x = 0; x < limit; x++) {
        attempts++;
        const hash = x % m;
        
        if (seen.has(hash)) {
            return {
                collision: { x: seen.get(hash), y: x, hash: hash },
                attempts: attempts
            };
        }
        
        seen.set(hash, x);
    }
    
    return { collision: null, attempts: attempts };
}

function hashEfficient(m, limit) {
    const hashToValue = new Map(); // Map hash -> first value that had this hash
    let attempts = 0;
    
    // Use √m range for better collision probability (birthday paradox)
    const range = Math.max(Math.ceil(Math.sqrt(m)), m);
    
    while (attempts < limit) {
        attempts++;
        const x = Math.floor(Math.random() * range);
        const hash = x % m;
        
        if (hashToValue.has(hash)) {
            // O(1) lookup of the original value that had this hash
            const originalValue = hashToValue.get(hash);
            return {
                collision: { x: originalValue, y: x, hash: hash },
                attempts: attempts
            };
        }
        
        hashToValue.set(hash, x);
    }
    
    return { collision: null, attempts: attempts };
}

function drawHashCollision(collision, m) {
    const canvas = document.getElementById('hashVisualization');
    const ctx = canvas.getContext('2d');
    
    // Redraw base visualization
    drawHashVisualization();
    
    // Highlight collision slot
    const cellWidth = Math.min(canvas.width / Math.min(m, 10), 40);
    const cellHeight = 30;
    const startX = (canvas.width - cellWidth * Math.min(m, 10)) / 2;
    const startY = 50;
    
    if (collision.hash < 10) {
        const x = startX + collision.hash * cellWidth;
        const y = startY;
        
        // Highlight collision slot
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(x, y, cellWidth, cellHeight);
        
        // Draw collision values
        ctx.fillStyle = '#dc3545';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${collision.x} → ${collision.hash}`, x + cellWidth/2, y + cellHeight + 20);
        ctx.fillText(`${collision.y} → ${collision.hash}`, x + cellWidth/2, y + cellHeight + 35);
        ctx.fillText('¡COLISIÓN!', x + cellWidth/2, y + cellHeight + 50);
    }
}

function compareHash() {
    const m = parseInt(document.getElementById('hashModulus').value);
    const limit = parseInt(document.getElementById('hashLimit').value);
    
    if (m < 2 || limit < 1) {
        showStatus('hash', 'Error: Módulo debe ser ≥ 2 y límite ≥ 1', 'error');
        return;
    }
    
    showStatus('hash', 'Ejecutando comparación de algoritmos...', 'loading');
    
    setTimeout(() => {
        try {
            const bruteResult = measureTime(() => hashBruteForce(m, limit));
            const efficientResult = measureTime(() => hashEfficient(m, limit));
            
            // Check if results are valid
            if (!bruteResult.result || !efficientResult.result) {
                showStatus('hash', 'Error: Algoritmos no completados correctamente', 'error');
                return;
            }
            
            // Update UI with unified metrics
            document.getElementById('hashBruteTime').textContent = bruteResult.time + ' ms';
            document.getElementById('hashBruteNodes').textContent = formatMetrics(bruteResult.result, 'attempts');
            document.getElementById('hashBruteResult').textContent = 
                bruteResult.result.collision ? `Colisión: ${bruteResult.result.collision.x} y ${bruteResult.result.collision.y} → ${bruteResult.result.collision.hash}` : 'No se encontró colisión';
            
            document.getElementById('hashEfficientTime').textContent = efficientResult.time + ' ms';
            document.getElementById('hashEfficientNodes').textContent = formatMetrics(efficientResult.result, 'attempts');
            document.getElementById('hashEfficientResult').textContent = 
                efficientResult.result.collision ? `Colisión: ${efficientResult.result.collision.x} y ${efficientResult.result.collision.y} → ${efficientResult.result.collision.hash}` : 'No se encontró colisión';
            
            // Draw charts
            drawChart('hashChartTime', [bruteResult.time, efficientResult.time], ['Secuencial', 'Aleatorio']);
            drawChart('hashChartNodes', [bruteResult.result.attempts || 0, efficientResult.result.attempts || 0], ['Secuencial', 'Aleatorio']);
            
            // Generate interpretive comment
            document.getElementById('hashComment').textContent = generateInterpretiveComment(bruteResult, efficientResult, 'hash');
            
            showStatus('hash', 'Comparación completada exitosamente', 'success');
            
            // Draw collision if found
            if (bruteResult.result.collision) {
                drawHashCollision(bruteResult.result.collision, m);
            }
        } catch (error) {
            showStatus('hash', `Error en comparación: ${error.message}`, 'error');
        }
    }, 100);
}

// Matrix Multiplication Visualization
function drawMatrixVisualization() {
    const canvas = document.getElementById('matrixVisualization');
    const ctx = canvas.getContext('2d');
    const matrixA = parseMatrix(document.getElementById('matrixA').value);
    const matrixB = parseMatrix(document.getElementById('matrixB').value);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Multiplicación de Matrices', canvas.width / 2, 25);
    
    // Draw matrices representation
    const cellSize = 25;
    const startY = 50;
    
    // Matrix A
    const aStartX = 50;
    ctx.fillText('A', aStartX + (matrixA[0].length * cellSize) / 2, startY - 10);
    for (let i = 0; i < matrixA.length; i++) {
        for (let j = 0; j < matrixA[0].length; j++) {
            const x = aStartX + j * cellSize;
            const y = startY + i * cellSize;
            
            ctx.strokeStyle = '#007bff';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize, cellSize);
            
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(matrixA[i][j].toString(), x + cellSize/2, y + cellSize/2 + 3);
        }
    }
    
    // Matrix B
    const bStartX = aStartX + matrixA[0].length * cellSize + 30;
    ctx.fillText('B', bStartX + (matrixB[0].length * cellSize) / 2, startY - 10);
    for (let i = 0; i < matrixB.length; i++) {
        for (let j = 0; j < matrixB[0].length; j++) {
            const x = bStartX + j * cellSize;
            const y = startY + i * cellSize;
            
            ctx.strokeStyle = '#28a745';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize, cellSize);
            
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(matrixB[i][j].toString(), x + cellSize/2, y + cellSize/2 + 3);
        }
    }
    
    // Result matrix placeholder
    const cStartX = bStartX + matrixB[0].length * cellSize + 30;
    const resultRows = matrixA.length;
    const resultCols = matrixB[0].length;
    
    ctx.fillText('A × B', cStartX + (resultCols * cellSize) / 2, startY - 10);
    for (let i = 0; i < resultRows; i++) {
        for (let j = 0; j < resultCols; j++) {
            const x = cStartX + j * cellSize;
            const y = startY + i * cellSize;
            
            ctx.strokeStyle = '#ffc107';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize, cellSize);
            
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('?', x + cellSize/2, y + cellSize/2 + 3);
        }
    }
    
    // Draw dimensions
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText(`${matrixA.length}×${matrixA[0].length}`, aStartX + (matrixA[0].length * cellSize) / 2, startY + matrixA.length * cellSize + 20);
    ctx.fillText(`${matrixB.length}×${matrixB[0].length}`, bStartX + (matrixB[0].length * cellSize) / 2, startY + matrixB.length * cellSize + 20);
    ctx.fillText(`${resultRows}×${resultCols}`, cStartX + (resultCols * cellSize) / 2, startY + resultRows * cellSize + 20);
}

// Cryptogram Visualization
function drawCryptogramVisualization(solution = null) {
    const canvas = document.getElementById('cryptogramVisualization');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Criptograma: SEND + MORE = MONEY', canvas.width / 2, 25);
    
    // Table layout for column-wise addition
    const tableX = 50;
    const tableY = 50;
    const cellWidth = 40;
    const cellHeight = 30;
    
    // Draw table headers (column positions)
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    const headers = ['10000s', '1000s', '100s', '10s', '1s'];
    headers.forEach((header, i) => {
        const x = tableX + i * cellWidth + cellWidth/2;
        ctx.fillText(header, x, tableY - 5);
    });
    
    // Draw carry row
    ctx.fillStyle = '#ff6b6b';
    ctx.font = '14px Arial';
    const carryY = tableY + cellHeight;
    for (let i = 0; i < 5; i++) {
        const x = tableX + i * cellWidth;
        ctx.strokeStyle = '#ddd';
        ctx.strokeRect(x, tableY, cellWidth, cellHeight);
        
        // Show carry values if solution exists
        if (solution) {
            let carry = '';
            if (i === 4) carry = Math.floor((solution.D + solution.E) / 10).toString();
            else if (i === 3) carry = Math.floor((solution.N + solution.R + Math.floor((solution.D + solution.E) / 10)) / 10).toString();
            else if (i === 2) carry = Math.floor((solution.E + solution.O + Math.floor((solution.N + solution.R + Math.floor((solution.D + solution.E) / 10)) / 10)) / 10).toString();
            else if (i === 1) carry = Math.floor((solution.S + solution.M + Math.floor((solution.E + solution.O + Math.floor((solution.N + solution.R + Math.floor((solution.D + solution.E) / 10)) / 10)) / 10)) / 10).toString();
            
            if (carry && carry !== '0') {
                ctx.fillText(carry, x + cellWidth/2, tableY + cellHeight/2 + 5);
            }
        }
    }
    
    // Draw SEND row
    ctx.fillStyle = '#007bff';
    const sendY = tableY + cellHeight;
    const sendLetters = ['', 'S', 'E', 'N', 'D'];
    sendLetters.forEach((letter, i) => {
        const x = tableX + i * cellWidth;
        ctx.strokeStyle = '#007bff';
        ctx.strokeRect(x, sendY, cellWidth, cellHeight);
        
        if (letter) {
            ctx.fillText(letter, x + cellWidth/2, sendY + cellHeight/2 + 5);
            // Show digit if solution exists
            if (solution && solution[letter] !== undefined) {
                ctx.fillStyle = '#666';
                ctx.font = '10px Arial';
                ctx.fillText(`(${solution[letter]})`, x + cellWidth/2, sendY + cellHeight - 5);
                ctx.fillStyle = '#007bff';
                ctx.font = '14px Arial';
            }
        }
    });
    
    // Draw MORE row
    ctx.fillStyle = '#28a745';
    const moreY = sendY + cellHeight;
    const moreLetters = ['', 'M', 'O', 'R', 'E'];
    moreLetters.forEach((letter, i) => {
        const x = tableX + i * cellWidth;
        ctx.strokeStyle = '#28a745';
        ctx.strokeRect(x, moreY, cellWidth, cellHeight);
        
        if (letter) {
            ctx.fillText(letter, x + cellWidth/2, moreY + cellHeight/2 + 5);
            // Show digit if solution exists
            if (solution && solution[letter] !== undefined) {
                ctx.fillStyle = '#666';
                ctx.font = '10px Arial';
                ctx.fillText(`(${solution[letter]})`, x + cellWidth/2, moreY + cellHeight - 5);
                ctx.fillStyle = '#28a745';
                ctx.font = '14px Arial';
            }
        }
    });
    
    // Draw line
    const lineY = moreY + cellHeight + 5;
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tableX, lineY);
    ctx.lineTo(tableX + 5 * cellWidth, lineY);
    ctx.stroke();
    
    // Draw MONEY row
    ctx.fillStyle = '#ffc107';
    const moneyY = lineY + 10;
    const moneyLetters = ['M', 'O', 'N', 'E', 'Y'];
    moneyLetters.forEach((letter, i) => {
        const x = tableX + i * cellWidth;
        ctx.strokeStyle = '#ffc107';
        ctx.strokeRect(x, moneyY, cellWidth, cellHeight);
        
        ctx.fillText(letter, x + cellWidth/2, moneyY + cellHeight/2 + 5);
        // Show digit if solution exists
        if (solution && solution[letter] !== undefined) {
            ctx.fillStyle = '#666';
            ctx.font = '10px Arial';
            ctx.fillText(`(${solution[letter]})`, x + cellWidth/2, moneyY + cellHeight - 5);
            ctx.fillStyle = '#ffc107';
            ctx.font = '14px Arial';
        }
    });
    
    // Show solution mapping if exists
    if (solution) {
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Solución encontrada:', tableX, moneyY + cellHeight + 30);
        
        const mapping = Object.entries(solution)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, digit]) => `${letter}=${digit}`)
            .join(', ');
        
        ctx.fillText(mapping, tableX, moneyY + cellHeight + 50);
        
        // Show the actual numbers
        const send = solution.S * 1000 + solution.E * 100 + solution.N * 10 + solution.D;
        const more = solution.M * 1000 + solution.O * 100 + solution.R * 10 + solution.E;
        const money = solution.M * 10000 + solution.O * 1000 + solution.N * 100 + solution.E * 10 + solution.Y;
        
        ctx.fillText(`${send} + ${more} = ${money}`, tableX, moneyY + cellHeight + 70);
    } else {
        // Show constraints when no solution
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Restricciones:', tableX, moneyY + cellHeight + 30);
        ctx.fillText('• Cada letra = dígito único (0-9)', tableX, moneyY + cellHeight + 50);
        ctx.fillText('• S y M ≠ 0 (sin ceros iniciales)', tableX, moneyY + cellHeight + 70);
        ctx.fillText('• Suma por columnas debe ser válida', tableX, moneyY + cellHeight + 90);
    }
}

// Matrix Multiplication Setup and Execution
function setupMatrixEvents() {
    document.getElementById('matrixBruteBtn').addEventListener('click', () => executeMatrix('brute'));
    document.getElementById('matrixEfficientBtn').addEventListener('click', () => executeMatrix('efficient'));
    document.getElementById('matrixCompareBtn').addEventListener('click', compareMatrix);
    document.getElementById('matrixLoadDemo').addEventListener('click', loadMatrixDemo);
    
    // Initialize visualization
    drawMatrixVisualization();
}

function executeMatrix(type) {
    const matrixAInput = document.getElementById('matrixA').value;
    const matrixBInput = document.getElementById('matrixB').value;
    
    const validation = validateMatrixInput(matrixAInput, matrixBInput);
    
    if (!validation.valid) {
        showValidationError('matrix', validation.error);
        return;
    }
    
    const matrixA = validation.A;
    const matrixB = validation.B;
    
    const algorithmName = type === 'brute' ? 'bloques' : 'Strassen';
    const algorithm = type === 'brute' ? () => matrixMultiplyBrute(matrixA, matrixB) : () => matrixMultiplyEfficient(matrixA, matrixB);
    
    showStatus('matrix', `Ejecutando multiplicación de matrices ${algorithmName}...`, 'info');
    
    createCancellableExecution(
        algorithm,
        'matrix'
    ).then(result => {
        if (result.cancelled) {
            showStatus('matrix', 'Algoritmo cancelado por el usuario', 'error');
            return;
        }
        
        if (result.timeout) {
            showStatus('matrix', 'Algoritmo cancelado por límite de tiempo', 'error');
            return;
        }
        
        // Check if result is valid
        if (!result.result) {
            showStatus('matrix', 'Error: Algoritmo no completado correctamente', 'error');
            return;
        }
        
        const targetId = type === 'brute' ? 'matrixBruteResult' : 'matrixEfficientResult';
        const timeId = type === 'brute' ? 'matrixBruteTime' : 'matrixEfficientTime';
        const opsId = type === 'brute' ? 'matrixBruteNodes' : 'matrixEfficientNodes';
        
        document.getElementById(targetId).textContent = formatMatrix(result.result);
        document.getElementById(timeId).textContent = result.time + ' ms';
        document.getElementById(opsId).textContent = result.result.operations || 'N/A';
        
        showStatus('matrix', `Multiplicación ${algorithmName} completada`, 'success');
        
        // Update visualization with result
        drawMatrixResult(result.result);
    }).catch(error => {
        showStatus('matrix', `Error en multiplicación: ${error.message}`, 'error');
    });
}

function matrixMultiplyBrute(A, B) {
    const rows = A.length;
    const cols = B[0].length;
    const inner = B.length;
    const result = [];
    let operations = 0;
    
    for (let i = 0; i < rows; i++) {
        result[i] = [];
        for (let j = 0; j < cols; j++) {
            result[i][j] = 0;
            for (let k = 0; k < inner; k++) {
                result[i][j] += A[i][k] * B[k][j];
                operations++;
            }
        }
    }
    
    result.operations = operations;
    return result;
}

function matrixMultiplyEfficient(A, B) {
    // Use Strassen's algorithm for matrices >= 4x4, otherwise use naive
    const threshold = 4;
    if (A.length < threshold || A[0].length < threshold || B[0].length < threshold) {
        return matrixMultiplyBrute(A, B);
    }
    
    return strassenMultiply(A, B);
}

function strassenMultiply(A, B) {
    const n = A.length;
    let operations = 0;
    
    // Base case: use naive multiplication for small matrices
    if (n <= 2) {
        const result = matrixMultiplyBrute(A, B);
        return result;
    }
    
    // Pad matrices to next power of 2 if needed
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(n)));
    const paddedA = padMatrix(A, nextPowerOf2);
    const paddedB = padMatrix(B, nextPowerOf2);
    
    const result = strassenRecursive(paddedA, paddedB);
    
    // Remove padding from result
    const finalResult = [];
    for (let i = 0; i < A.length; i++) {
        finalResult[i] = [];
        for (let j = 0; j < B[0].length; j++) {
            finalResult[i][j] = result[i][j];
        }
    }
    
    // Count operations (approximation for Strassen)
    finalResult.operations = Math.floor(7 * Math.pow(n, Math.log2(7)));
    return finalResult;
}

function strassenRecursive(A, B) {
    const n = A.length;
    
    if (n <= 2) {
        return matrixMultiplyBrute(A, B);
    }
    
    const half = n / 2;
    
    // Divide matrices into quadrants
    const A11 = getSubMatrix(A, 0, 0, half);
    const A12 = getSubMatrix(A, 0, half, half);
    const A21 = getSubMatrix(A, half, 0, half);
    const A22 = getSubMatrix(A, half, half, half);
    
    const B11 = getSubMatrix(B, 0, 0, half);
    const B12 = getSubMatrix(B, 0, half, half);
    const B21 = getSubMatrix(B, half, 0, half);
    const B22 = getSubMatrix(B, half, half, half);
    
    // Calculate the 7 Strassen products
    const M1 = strassenRecursive(addMatrices(A11, A22), addMatrices(B11, B22));
    const M2 = strassenRecursive(addMatrices(A21, A22), B11);
    const M3 = strassenRecursive(A11, subtractMatrices(B12, B22));
    const M4 = strassenRecursive(A22, subtractMatrices(B21, B11));
    const M5 = strassenRecursive(addMatrices(A11, A12), B22);
    const M6 = strassenRecursive(subtractMatrices(A21, A11), addMatrices(B11, B12));
    const M7 = strassenRecursive(subtractMatrices(A12, A22), addMatrices(B21, B22));
    
    // Calculate result quadrants
    const C11 = addMatrices(subtractMatrices(addMatrices(M1, M4), M5), M7);
    const C12 = addMatrices(M3, M5);
    const C21 = addMatrices(M2, M4);
    const C22 = addMatrices(subtractMatrices(addMatrices(M1, M3), M2), M6);
    
    // Combine quadrants into result matrix
    const result = [];
    for (let i = 0; i < n; i++) {
        result[i] = [];
        for (let j = 0; j < n; j++) {
            if (i < half && j < half) {
                result[i][j] = C11[i][j];
            } else if (i < half && j >= half) {
                result[i][j] = C12[i][j - half];
            } else if (i >= half && j < half) {
                result[i][j] = C21[i - half][j];
            } else {
                result[i][j] = C22[i - half][j - half];
            }
        }
    }
    
    return result;
}

function padMatrix(matrix, size) {
    const result = [];
    for (let i = 0; i < size; i++) {
        result[i] = [];
        for (let j = 0; j < size; j++) {
            if (i < matrix.length && j < matrix[0].length) {
                result[i][j] = matrix[i][j];
            } else {
                result[i][j] = 0;
            }
        }
    }
    return result;
}

function getSubMatrix(matrix, startRow, startCol, size) {
    const result = [];
    for (let i = 0; i < size; i++) {
        result[i] = [];
        for (let j = 0; j < size; j++) {
            result[i][j] = matrix[startRow + i][startCol + j];
        }
    }
    return result;
}

function addMatrices(A, B) {
    const result = [];
    for (let i = 0; i < A.length; i++) {
        result[i] = [];
        for (let j = 0; j < A[0].length; j++) {
            result[i][j] = A[i][j] + B[i][j];
        }
    }
    return result;
}

function subtractMatrices(A, B) {
    const result = [];
    for (let i = 0; i < A.length; i++) {
        result[i] = [];
        for (let j = 0; j < A[0].length; j++) {
            result[i][j] = A[i][j] - B[i][j];
        }
    }
    return result;
}

function drawMatrixResult(result) {
    const canvas = document.getElementById('matrixVisualization');
    const ctx = canvas.getContext('2d');
    
    // Redraw base visualization
    drawMatrixVisualization();
    
    // Draw result matrix with enhanced styling
    const cellSize = 25;
    const startY = 50;
    const matrixA = parseMatrix(document.getElementById('matrixA').value);
    const matrixB = parseMatrix(document.getElementById('matrixB').value);
    const cStartX = 50 + matrixA[0].length * cellSize + 30 + matrixB[0].length * cellSize + 30;
    
    for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result[0].length; j++) {
            const x = cStartX + j * cellSize;
            const y = startY + i * cellSize;
            
            // Highlight result cells with gradient background
            const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
            gradient.addColorStop(0, '#e8f5e8');
            gradient.addColorStop(1, '#c8e6c9');
            ctx.fillStyle = gradient;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            
            // Add subtle border for result cells
            ctx.strokeStyle = '#4caf50';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            
            // Draw the result value with enhanced styling
            ctx.fillStyle = '#2e7d32';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(result[i][j].toString(), x + cellSize/2, y + cellSize/2);
        }
    }
    
    // Add result label
    ctx.fillStyle = '#2e7d32';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Resultado', cStartX + (result[0].length * cellSize) / 2, startY - 15);
}

function compareMatrix() {
    const matrixA = parseMatrix(document.getElementById('matrixA').value);
    const matrixB = parseMatrix(document.getElementById('matrixB').value);
    
    if (!matrixA || !matrixB || matrixA[0].length !== matrixB.length) {
        showStatus('matrix', 'Error: Matrices inválidas o incompatibles para multiplicación', 'error');
        return;
    }
    
    showStatus('matrix', 'Ejecutando comparación de algoritmos...', 'loading');
    
    setTimeout(() => {
        try {
            const bruteResult = measureTime(() => matrixMultiplyBrute(matrixA, matrixB));
            const efficientResult = measureTime(() => matrixMultiplyEfficient(matrixA, matrixB));
            
            // Check if results are valid
            if (!bruteResult.result || !efficientResult.result) {
                showStatus('matrix', 'Error: Algoritmos no completados correctamente', 'error');
                return;
            }
            
            // Update UI with unified metrics
            document.getElementById('matrixBruteTime').textContent = bruteResult.time + ' ms';
            document.getElementById('matrixBruteNodes').textContent = formatMetrics(bruteResult.result, 'operations');
            document.getElementById('matrixBruteResult').textContent = formatMatrix(bruteResult.result);
            
            document.getElementById('matrixEfficientTime').textContent = efficientResult.time + ' ms';
            document.getElementById('matrixEfficientNodes').textContent = formatMetrics(efficientResult.result, 'operations');
            document.getElementById('matrixEfficientResult').textContent = formatMatrix(efficientResult.result);
            
            // Draw charts
            drawChart('matrixChartTime', [bruteResult.time, efficientResult.time], ['Bloques', 'Strassen']);
            drawChart('matrixChartNodes', [bruteResult.result.operations || 0, efficientResult.result.operations || 0], ['Bloques', 'Strassen']);
            
            // Generate interpretive comment
            document.getElementById('matrixComment').textContent = generateInterpretiveComment(bruteResult, efficientResult, 'matrix');
            
            showStatus('matrix', 'Comparación completada exitosamente', 'success');
            
            // Draw result
            drawMatrixResult(bruteResult.result);
        } catch (error) {
            showStatus('matrix', `Error en comparación: ${error.message}`, 'error');
        }
    }, 100);
}

function loadMatrixDemo() {
    document.getElementById('matrixA').value = '[[1,2],[3,4]]';
    document.getElementById('matrixB').value = '[[5,6],[7,8]]';
    drawMatrixVisualization();
}

// Cryptogram Setup and Execution
function setupCryptogramEvents() {
    document.getElementById('cryptogramBruteBtn').addEventListener('click', () => executeCryptogram('brute'));
    document.getElementById('cryptogramEfficientBtn').addEventListener('click', () => executeCryptogram('efficient'));
    document.getElementById('cryptogramCompareBtn').addEventListener('click', compareCryptogram);
    
    // Initialize visualization
    drawCryptogramVisualization();
}

function executeCryptogram(type) {
    const algorithmName = type === 'brute' ? 'por fuerza bruta' : 'con heurísticas';
    const algorithm = type === 'brute' ? () => cryptogramBruteForce() : () => cryptogramEfficient();
    
    showStatus('cryptogram', `Ejecutando resolución Criptograma ${algorithmName}...`, 'info');
    
    createCancellableExecution(
        algorithm,
        'cryptogram'
    ).then(result => {
        if (result.cancelled) {
            showStatus('cryptogram', 'Algoritmo cancelado por el usuario', 'error');
            return;
        }
        
        if (result.timeout) {
            showStatus('cryptogram', 'Algoritmo cancelado por límite de tiempo', 'error');
            return;
        }
        
        const targetId = type === 'brute' ? 'cryptogramBruteResult' : 'cryptogramEfficientResult';
        const timeId = type === 'brute' ? 'cryptogramBruteTime' : 'cryptogramEfficientTime';
        const attemptsId = type === 'brute' ? 'cryptogramBruteNodes' : 'cryptogramEfficientNodes';
        
        // Check if result.result is valid
        if (!result.result) {
            showStatus('cryptogram', 'Error en algoritmo: No se encontró solución', 'error');
            return;
        }
        
        if (result.result.solution) {
            document.getElementById(targetId).textContent = formatCryptogramSolution(result.result.solution);
        } else {
            document.getElementById(targetId).textContent = 'No se encontró solución';
        }
        
        document.getElementById(timeId).textContent = result.time + ' ms';
        document.getElementById(attemptsId).textContent = result.result.attempts || 0;
        
        showStatus('cryptogram', `Resolución ${algorithmName} completada`, 'success');
        
        // Update visualization with solution
        if (result.result.solution) {
            drawCryptogramVisualization(result.result.solution);
        }
    }).catch(error => {
        showStatus('cryptogram', `Error en resolución: ${error.message}`, 'error');
    });
}

function cryptogramBruteForce(ignoreLimit = false) {
    // SEND + MORE = MONEY
    // Backtracking by letters (more efficient than nested loops)
    let attempts = 0;
    const letters = ['S', 'E', 'N', 'D', 'M', 'O', 'R', 'Y'];
    const assignment = {};
    const used = new Set();
    
    function isValidAssignment() {
        const { S, E, N, D, M, O, R, Y } = assignment;
        
        // S and M cannot be 0 (leading digits)
        if (S === 0 || M === 0) return false;
        
        const send = S * 1000 + E * 100 + N * 10 + D;
        const more = M * 1000 + O * 100 + R * 10 + E;
        const money = M * 10000 + O * 1000 + N * 100 + E * 10 + Y;
        
        return send + more === money;
    }
    
    function backtrack(letterIndex) {
        attempts++;
        
        // Check for cancellation every 1000 attempts
        if (attempts % 1000 === 0) {
            if (ignoreLimit) {
                if (algorithmCancelled) {
                    throw new Error('Algoritmo cancelado por el usuario');
                }
            } else {
                checkCancellation(attempts, 'cryptogram');
            }
        }
        
        if (letterIndex === letters.length) {
            // All letters assigned, check if valid
            if (isValidAssignment()) {
                return { S: assignment.S, E: assignment.E, N: assignment.N, D: assignment.D, 
                        M: assignment.M, O: assignment.O, R: assignment.R, Y: assignment.Y };
            }
            return null;
        }
        
        const letter = letters[letterIndex];
        const startDigit = (letter === 'S' || letter === 'M') ? 1 : 0; // S and M cannot be 0
        
        for (let digit = startDigit; digit <= 9; digit++) {
            if (!used.has(digit)) {
                assignment[letter] = digit;
                used.add(digit);
                
                const result = backtrack(letterIndex + 1);
                if (result) {
                    return result;
                }
                
                delete assignment[letter];
                used.delete(digit);
            }
        }
        
        return null;
    }
    
    const solution = backtrack(0);
    return { solution: solution, attempts: attempts };
}

function cryptogramEfficient(ignoreLimit = false) {
    // Backtracking by columns (right to left) with carry and local consistency
    let attempts = 0;
    const maxAttempts = ignoreLimit ? Infinity : 100000;
    
    // Variables: S, E, N, D, M, O, R, Y
    const assignment = {};
    const used = new Set();
    
    function isValid(assignment) {
        // Check if current assignment satisfies constraints
        const { S, E, N, D, M, O, R, Y } = assignment;
        
        // S and M cannot be 0 (leading digits)
        if (S === 0 || M === 0) return false;
        
        // Check if we have enough variables assigned to validate
        if (D !== undefined && E !== undefined && Y !== undefined) {
            // Units column: D + E = Y (mod 10)
            const carry1 = Math.floor((D + E) / 10);
            if ((D + E) % 10 !== Y) return false;
            
            if (N !== undefined && R !== undefined) {
                // Tens column: N + R + carry1 = E (mod 10)
                const carry2 = Math.floor((N + R + carry1) / 10);
                if ((N + R + carry1) % 10 !== E) return false;
                
                if (E !== undefined && O !== undefined) {
                    // Hundreds column: E + O + carry2 = N (mod 10)
                    const carry3 = Math.floor((E + O + carry2) / 10);
                    if ((E + O + carry2) % 10 !== N) return false;
                    
                    if (S !== undefined && M !== undefined) {
                        // Thousands column: S + M + carry3 = O (mod 10)
                        const carry4 = Math.floor((S + M + carry3) / 10);
                        if ((S + M + carry3) % 10 !== O) return false;
                        
                        // Ten thousands column: carry4 = M
                        if (carry4 !== M) return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    function solve(variables, index) {
        attempts++;
        if (attempts > maxAttempts) return null;
        
        // Check for cancellation every 1000 attempts when ignoring limit
        if (ignoreLimit && attempts % 1000 === 0) {
            // Only check if manually cancelled, no time or node limits
            if (algorithmCancelled) {
                throw new Error('Algoritmo cancelado por el usuario');
            }
        }
        
        if (index === variables.length) {
            return isValid(assignment) ? { ...assignment } : null;
        }
        
        const variable = variables[index];
        const startDigit = (variable === 'S' || variable === 'M') ? 1 : 0;
        
        for (let digit = startDigit; digit <= 9; digit++) {
            if (!used.has(digit)) {
                assignment[variable] = digit;
                used.add(digit);
                
                if (isValid(assignment)) {
                    const result = solve(variables, index + 1);
                    if (result) return result;
                }
                
                delete assignment[variable];
                used.delete(digit);
            }
        }
        
        return null;
    }
    
    // Order variables for better pruning: start with most constrained
    const variables = ['D', 'E', 'Y', 'N', 'R', 'O', 'S', 'M'];
    const solution = solve(variables, 0);
    
    return { solution: solution, attempts: attempts };
}

function drawCryptogramSolution(solution) {
    // Use the new visualization with solution parameter
    drawCryptogramVisualization(solution);
}

function compareCryptogram() {
    showStatus('cryptogram', 'Ejecutando comparación de algoritmos...', 'loading');
    
    // Reset cancellation but don't use the global system for comparison
    algorithmCancelled = false;
    algorithmStartTime = Date.now();
    
    setTimeout(() => {
        try {
            const bruteResult = measureTime(() => cryptogramBruteForce(true)); // ignoreLimit = true
            const efficientResult = measureTime(() => cryptogramEfficient(true)); // ignoreLimit = true
            
            // Check if results are valid
            if (!bruteResult.result || !efficientResult.result) {
                showStatus('cryptogram', 'Error: Algoritmos no completados correctamente', 'error');
                return;
            }
            
            // Update UI with unified metrics
            document.getElementById('cryptogramBruteTime').textContent = bruteResult.time + ' ms';
            document.getElementById('cryptogramBruteNodes').textContent = formatMetrics(bruteResult.result, 'attempts');
            document.getElementById('cryptogramBruteResult').textContent = 
                bruteResult.result.solution ? formatCryptogramSolution(bruteResult.result.solution) : 'No se encontró solución';
            
            document.getElementById('cryptogramEfficientTime').textContent = efficientResult.time + ' ms';
            document.getElementById('cryptogramEfficientNodes').textContent = formatMetrics(efficientResult.result, 'attempts');
            document.getElementById('cryptogramEfficientResult').textContent = 
                efficientResult.result.solution ? formatCryptogramSolution(efficientResult.result.solution) : 'No se encontró solución';
            
            // Draw charts
            drawChart('cryptogramChartTime', [bruteResult.time, efficientResult.time], ['Fuerza Bruta', 'Heurísticas']);
            drawChart('cryptogramChartNodes', [bruteResult.result.attempts || 0, efficientResult.result.attempts || 0], ['Fuerza Bruta', 'Heurísticas']);
            
            // Generate interpretive comment
            document.getElementById('cryptogramComment').textContent = generateInterpretiveComment(bruteResult, efficientResult, 'cryptogram');
            
            showStatus('cryptogram', 'Comparación completada exitosamente', 'success');
            
            // Draw solution if found
            if (efficientResult.result.solution) {
                drawCryptogramVisualization(efficientResult.result.solution);
            }
        } catch (error) {
            showStatus('cryptogram', `Error en comparación: ${error.message}`, 'error');
        }
    }, 100);
}

function formatCryptogramSolution(solution) {
    return `S=${solution.S}, E=${solution.E}, N=${solution.N}, D=${solution.D}, M=${solution.M}, O=${solution.O}, R=${solution.R}, Y=${solution.Y}`;
}

// Sudoku Setup and Execution
function setupSudokuEvents() {
    document.getElementById('sudokuBruteBtn').addEventListener('click', () => executeSudoku('brute'));
    document.getElementById('sudokuEfficientBtn').addEventListener('click', () => executeSudoku('efficient'));
    document.getElementById('sudokuCompareBtn').addEventListener('click', compareSudoku);
    document.getElementById('sudokuLoadDemo').addEventListener('click', loadSudokuDemo);
}

function executeSudoku(type) {
    const input = document.getElementById('sudokuInput').value;
    const validation = validateSudokuInput(input);
    
    if (!validation.valid) {
        showValidationError('sudoku', validation.error);
        return;
    }
    
    const board = validation.board;
    const strategy = document.getElementById('sudokuStrategy').value;
    const searchType = document.getElementById('sudokuSearchType').value;
    
    const algorithmName = type === 'brute' ? 'por fuerza bruta' : 'con heurísticas';
    const algorithm = type === 'brute' ? 
        () => sudokuBruteForce([...board.map(row => [...row])], strategy, searchType) : 
        () => sudokuEfficient([...board.map(row => [...row])], strategy, searchType);
    
    showStatus('sudoku', `Ejecutando resolución Sudoku ${algorithmName}...`, 'info');
    
    createCancellableExecution(
        algorithm,
        'sudoku'
    ).then(result => {
        if (result.cancelled) {
            showStatus('sudoku', 'Algoritmo cancelado por el usuario', 'error');
            return;
        }
        
        if (result.timeout) {
            showStatus('sudoku', 'Algoritmo cancelado por límite de tiempo', 'error');
            return;
        }
        
        const targetId = type === 'brute' ? 'sudokuBruteResult' : 'sudokuEfficientResult';
        const timeId = type === 'brute' ? 'sudokuBruteTime' : 'sudokuEfficientTime';
        const stepsId = type === 'brute' ? 'sudokuBruteNodes' : 'sudokuEfficientNodes';
        
        // Check if result.result is valid
        if (!result.result) {
            showStatus('sudoku', 'Error en algoritmo: No se encontró solución', 'error');
            return;
        }
        
        if (result.result.solution) {
            document.getElementById(targetId).textContent = 'Solución encontrada';
            // Draw before and after boards
            drawSudokuBoardBefore(board);
            drawSudokuBoardAfter(result.result.solution, board);
        } else {
            document.getElementById(targetId).textContent = 'No se encontró solución';
            // Only draw the initial board
            drawSudokuBoardBefore(board);
        }
        
        document.getElementById(timeId).textContent = result.time + ' ms';
        document.getElementById(stepsId).textContent = result.result.steps || 0;
        
        showStatus('sudoku', `Resolución ${algorithmName} completada`, 'success');
    }).catch(error => {
        showStatus('sudoku', `Error en resolución: ${error.message}`, 'error');
    });
}

function sudokuBruteForce(board, strategy = 'simple', searchType = 'dfs') {
    let steps = 0;
    
    if (searchType === 'bfs') {
        // BFS implementation using queue
        const queue = [JSON.parse(JSON.stringify(board))];
        
        while (queue.length > 0) {
            steps++;
            
            // Check for cancellation every 1000 steps
            if (steps % 1000 === 0) {
                checkCancellation(steps, 'sudoku');
            }
            
            const currentBoard = queue.shift();
            
            // Find first empty cell
            let emptyRow = -1, emptyCol = -1;
            for (let row = 0; row < 9 && emptyRow === -1; row++) {
                for (let col = 0; col < 9; col++) {
                    if (currentBoard[row][col] === 0) {
                        emptyRow = row;
                        emptyCol = col;
                        break;
                    }
                }
            }
            
            if (emptyRow === -1) {
                // Board is complete
                return {
                    solution: currentBoard,
                    steps: steps
                };
            }
            
            // Try numbers 1-9
            for (let num = 1; num <= 9; num++) {
                if (isValidMove(currentBoard, emptyRow, emptyCol, num)) {
                    const newBoard = JSON.parse(JSON.stringify(currentBoard));
                    newBoard[emptyRow][emptyCol] = num;
                    queue.push(newBoard);
                }
            }
        }
        
        return {
            solution: null,
            steps: steps
        };
    } else {
        // DFS implementation (recursive)
        function solve(board) {
            steps++;
            
            // Check for cancellation every 1000 steps
            if (steps % 1000 === 0) {
                checkCancellation(steps, 'sudoku');
            }
            
            // Find empty cell (simple strategy: first empty cell)
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        // Try numbers 1-9
                        for (let num = 1; num <= 9; num++) {
                            if (isValidMove(board, row, col, num)) {
                                board[row][col] = num;
                                
                                if (solve(board)) {
                                    return true;
                                }
                                
                                board[row][col] = 0; // Backtrack
                            }
                        }
                        return false;
                    }
                }
            }
            return true; // Board is complete
        }
        
        const success = solve(board);
        return {
            solution: success ? board : null,
            steps: steps
        };
    }
}

function sudokuEfficient(board, strategy = 'mrv', searchType = 'dfs') {
    let steps = 0;
    
    // Initialize domains for forward checking
    function initializeDomains(board) {
        const domains = [];
        for (let row = 0; row < 9; row++) {
            domains[row] = [];
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    domains[row][col] = [];
                    for (let num = 1; num <= 9; num++) {
                        if (isValidMove(board, row, col, num)) {
                            domains[row][col].push(num);
                        }
                    }
                } else {
                    domains[row][col] = [board[row][col]];
                }
            }
        }
        return domains;
    }
    
    // Forward checking: remove value from domains of affected cells
    function forwardCheck(domains, row, col, value) {
        const removedValues = [];
        
        // Check row
        for (let c = 0; c < 9; c++) {
            if (c !== col && domains[row][c].includes(value)) {
                const index = domains[row][c].indexOf(value);
                domains[row][c].splice(index, 1);
                removedValues.push({row: row, col: c, value: value});
                
                // Early failure detection
                if (domains[row][c].length === 0 && board[row][c] === 0) {
                    return {valid: false, removedValues: removedValues};
                }
            }
        }
        
        // Check column
        for (let r = 0; r < 9; r++) {
            if (r !== row && domains[r][col].includes(value)) {
                const index = domains[r][col].indexOf(value);
                domains[r][col].splice(index, 1);
                removedValues.push({row: r, col: col, value: value});
                
                // Early failure detection
                if (domains[r][col].length === 0 && board[r][col] === 0) {
                    return {valid: false, removedValues: removedValues};
                }
            }
        }
        
        // Check 3x3 box
        const startRow = row - row % 3;
        const startCol = col - col % 3;
        for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
                if ((r !== row || c !== col) && domains[r][c].includes(value)) {
                    const index = domains[r][c].indexOf(value);
                    domains[r][c].splice(index, 1);
                    removedValues.push({row: r, col: c, value: value});
                    
                    // Early failure detection
                    if (domains[r][c].length === 0 && board[r][c] === 0) {
                        return {valid: false, removedValues: removedValues};
                    }
                }
            }
        }
        
        return {valid: true, removedValues: removedValues};
    }
    
    // Restore domains after backtracking
    function restoreDomains(domains, removedValues) {
        for (const removed of removedValues) {
            domains[removed.row][removed.col].push(removed.value);
        }
    }
    
    function findBestCell(board, domains, strategy) {
        let bestRow = -1, bestCol = -1;
        
        if (strategy === 'mrv') {
            // Find cell with minimum remaining values (MRV heuristic)
            let minPossibilities = 10;
            
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        const possibilities = domains[row][col].length;
                        
                        if (possibilities < minPossibilities) {
                            minPossibilities = possibilities;
                            bestRow = row;
                            bestCol = col;
                        }
                        
                        // If we find a cell with no possibilities, fail early
                        if (possibilities === 0) {
                            return {row: -2, col: -2}; // Indicates failure
                        }
                    }
                }
            }
        } else {
            // Simple strategy: first empty cell
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        bestRow = row;
                        bestCol = col;
                        break;
                    }
                }
                if (bestRow !== -1) break;
            }
        }
        
        return {row: bestRow, col: bestCol};
    }
    
    const domains = initializeDomains(board);
    
    if (searchType === 'bfs') {
        // BFS implementation using queue with forward checking
        const queue = [{board: JSON.parse(JSON.stringify(board)), domains: JSON.parse(JSON.stringify(domains))}];
        
        while (queue.length > 0) {
            steps++;
            
            // Check for cancellation every 1000 steps
            if (steps % 1000 === 0) {
                checkCancellation(steps, 'sudoku');
            }
            
            const {board: currentBoard, domains: currentDomains} = queue.shift();
            const {row: bestRow, col: bestCol} = findBestCell(currentBoard, currentDomains, strategy);
            
            if (bestRow === -1) {
                // Board is complete
                return {
                    solution: currentBoard,
                    steps: steps
                };
            }
            
            if (bestRow === -2) {
                // No valid moves (forward checking detected failure)
                continue;
            }
            
            // Try numbers for the selected cell
            for (const num of currentDomains[bestRow][bestCol]) {
                const newBoard = JSON.parse(JSON.stringify(currentBoard));
                const newDomains = JSON.parse(JSON.stringify(currentDomains));
                
                newBoard[bestRow][bestCol] = num;
                const forwardCheckResult = forwardCheck(newDomains, bestRow, bestCol, num);
                
                if (forwardCheckResult.valid) {
                    queue.push({board: newBoard, domains: newDomains});
                }
            }
        }
        
        return {
            solution: null,
            steps: steps
        };
    } else {
        // DFS implementation with forward checking (recursive)
        function solve(board, domains) {
            steps++;
            
            // Check for cancellation every 1000 steps
            if (steps % 1000 === 0) {
                checkCancellation(steps, 'sudoku');
            }
            
            const {row: bestRow, col: bestCol} = findBestCell(board, domains, strategy);
            
            if (bestRow === -1) return true; // Board is complete
            if (bestRow === -2) return false; // No valid moves
            
            // Try numbers for the selected cell using domain values
            for (const num of [...domains[bestRow][bestCol]]) {
                board[bestRow][bestCol] = num;
                
                // Apply forward checking
                const forwardCheckResult = forwardCheck(domains, bestRow, bestCol, num);
                
                if (forwardCheckResult.valid) {
                    if (solve(board, domains)) {
                        return true;
                    }
                }
                
                // Backtrack: restore board and domains
                board[bestRow][bestCol] = 0;
                restoreDomains(domains, forwardCheckResult.removedValues);
            }
            return false;
        }
        
        const success = solve(board, domains);
        return {
            solution: success ? board : null,
            steps: steps
        };
    }
}

function isValidMove(board, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
    }
    
    // Check 3x3 box
    const startRow = row - row % 3;
    const startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num) return false;
        }
    }
    
    return true;
}

function getSudokuBoard() {
    const input = document.getElementById('sudokuInput').value;
    return parseSudoku(input);
}

function updateSudokuBoard(solution, originalBoard = null) {
    const formatted = solution.map(row => row.join('')).join(';');
    document.getElementById('sudokuInput').value = formatted;
    
    // Draw both boards
    if (originalBoard) {
        drawSudokuBoardBefore(originalBoard);
        drawSudokuBoardAfter(solution, originalBoard);
    } else {
        drawSudokuBoardAfter(solution, null);
    }
}

function isValidSudokuInput(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const num = board[row][col];
            if (num !== 0) {
                // Temporarily remove the number to check validity
                board[row][col] = 0;
                if (!isValidMove(board, row, col, num)) {
                    board[row][col] = num; // Restore
                    return false;
                }
                board[row][col] = num; // Restore
            }
        }
    }
    return true;
}

function compareSudoku() {
    const board = getSudokuBoard();
    
    if (!isValidSudokuInput(board)) {
        showStatus('sudoku', 'Error: Tablero de Sudoku inválido', 'error');
        return;
    }
    
    showStatus('sudoku', 'Ejecutando comparación de algoritmos...', 'loading');
    
    setTimeout(() => {
        try {
            const strategy = document.getElementById('sudokuStrategy').value;
            const searchType = document.getElementById('sudokuSearchType').value;
            const bruteResult = measureTime(() => sudokuBruteForce([...board.map(row => [...row])], strategy, searchType));
            const efficientResult = measureTime(() => sudokuEfficient([...board.map(row => [...row])], strategy, searchType));
            
            // Check if results are valid
            if (!bruteResult.result || !efficientResult.result) {
                showStatus('sudoku', 'Error: Algoritmos no completados correctamente', 'error');
                return;
            }
            
            // Update UI with unified metrics
            document.getElementById('sudokuBruteTime').textContent = bruteResult.time + ' ms';
            document.getElementById('sudokuBruteNodes').textContent = formatMetrics(bruteResult.result, 'nodes');
            document.getElementById('sudokuBruteResult').textContent = 
                bruteResult.result.solution ? 'Solución encontrada' : 'No se encontró solución';
            
            document.getElementById('sudokuEfficientTime').textContent = efficientResult.time + ' ms';
            document.getElementById('sudokuEfficientNodes').textContent = formatMetrics(efficientResult.result, 'nodes');
            document.getElementById('sudokuEfficientResult').textContent = 
                efficientResult.result.solution ? 'Solución encontrada' : 'No se encontró solución';
            
            // Draw charts
            drawChart('sudokuChartTime', [bruteResult.time, efficientResult.time], ['Fuerza Bruta', 'Heurísticas']);
            drawChart('sudokuChartNodes', [bruteResult.result.steps || 0, efficientResult.result.steps || 0], ['Fuerza Bruta', 'Heurísticas']);
            
            // Generate interpretive comment
            document.getElementById('sudokuComment').textContent = generateInterpretiveComment(bruteResult, efficientResult, 'sudoku');
            
            showStatus('sudoku', 'Comparación completada exitosamente', 'success');
            
            // Update board with solution
            if (efficientResult.result.solution) {
                drawSudokuBoardBefore(board);
                drawSudokuBoardAfter(efficientResult.result.solution, board);
            } else {
                drawSudokuBoardBefore(board);
            }
        } catch (error) {
            showStatus('sudoku', `Error en comparación: ${error.message}`, 'error');
        }
    }, 100);
}

function loadSudokuDemo() {
    document.getElementById('sudokuInput').value = '530070000;600195000;098000060;800060003;400803001;700020006;060000280;000419005;000080079';
    const board = parseSudoku(document.getElementById('sudokuInput').value);
    drawSudokuBoardBefore(board);
}

function loadHashDemo() {
    document.getElementById('hashInput').value = '10';
    document.getElementById('hashLimit').value = '100';
    drawHashVisualization();
}

function loadCryptogramDemo() {
    // El problema es fijo: SEND + MORE = MONEY
    drawCryptogramVisualization();
}

function drawSudokuBoardBefore(board) {
    const canvas = document.getElementById('sudokuBoardBefore');
    if (!canvas) return;
    
    drawSudokuBoardOnCanvas(canvas, board, false);
}

function drawSudokuBoardAfter(solution, originalBoard) {
    const canvas = document.getElementById('sudokuBoardAfter');
    if (!canvas) return;
    
    drawSudokuBoardOnCanvas(canvas, solution, true, originalBoard);
}

function drawSudokuBoardOnCanvas(canvas, board, showSolution = false, originalBoard = null) {
    const ctx = canvas.getContext('2d');
    const cellSize = 30;
    const boardSize = cellSize * 9;
    
    canvas.width = boardSize;
    canvas.height = boardSize;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Draw cells
    for (let i = 0; i <= 9; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, boardSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(boardSize, i * cellSize);
        ctx.stroke();
    }
    
    // Draw thick lines for 3x3 boxes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    
    for (let i = 0; i <= 9; i += 3) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, boardSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(boardSize, i * cellSize);
        ctx.stroke();
    }
    
    if (board) {
        // First, highlight filled cells with background color
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] !== 0) {
                    const x = col * cellSize;
                    const y = row * cellSize;
                    
                    // Highlight filled cells with light blue background
                    ctx.fillStyle = '#e3f2fd';
                    ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                    
                    // Add subtle border for filled cells
                    ctx.strokeStyle = '#2196f3';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
                }
            }
        }
        
        // Then draw the numbers
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] !== 0) {
                    const x = col * cellSize + cellSize / 2;
                    const y = row * cellSize + cellSize / 2;
                    
                    if (showSolution && originalBoard) {
                        // Determine if this is an original number or solved number
                        const isOriginal = originalBoard[row] && originalBoard[row][col] !== 0;
                        // Use different colors for given vs solved numbers
                        ctx.fillStyle = isOriginal ? '#1976d2' : '#4caf50'; // Blue for given, green for solved
                    } else {
                        // For "before" board, use blue for all given numbers
                        ctx.fillStyle = '#1976d2';
                    }
                    
                    ctx.fillText(board[row][col].toString(), x, y);
                }
            }
        }
    }
}

// Code Tab and Copy Functionality
function setupCodeTabs() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('code-tab')) {
            const tabId = e.target.getAttribute('data-tab');
            const tabContainer = e.target.closest('.code-section');
            
            // Remove active class from all tabs and blocks in this container
            tabContainer.querySelectorAll('.code-tab').forEach(tab => tab.classList.remove('active'));
            tabContainer.querySelectorAll('.code-block').forEach(block => block.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding block
            e.target.classList.add('active');
            const targetBlock = tabContainer.querySelector(`#${tabId}`);
            if (targetBlock) {
                targetBlock.classList.add('active');
            }
        }
    });
}

function copyCode(codeId) {
    const codeElement = document.getElementById(codeId);
    if (!codeElement) return;
    
    const text = codeElement.textContent;
    
    // Try to use the modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showCopySuccess(codeId);
        }).catch(() => {
            fallbackCopyTextToClipboard(text, codeId);
        });
    } else {
        fallbackCopyTextToClipboard(text, codeId);
    }
}

function fallbackCopyTextToClipboard(text, codeId) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess(codeId);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    
    document.body.removeChild(textArea);
}

function showCopySuccess(codeId) {
    const codeElement = document.getElementById(codeId);
    const copyBtn = codeElement.closest('.code-block').querySelector('.copy-btn');
    
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '¡Copiado!';
    copyBtn.style.background = '#4caf50';
    
    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '#667eea';
    }, 2000);
}

// Enhanced Input Validation Functions
function validateTSPInput(input) {
    if (!input || input.trim() === '') {
        return { valid: false, error: 'Por favor ingrese coordenadas de ciudades.' };
    }
    
    try {
        const coords = parseCoordinates(input);
        if (coords.length < 2) {
            return { valid: false, error: 'Se necesitan al menos 2 ciudades para el TSP.' };
        }
        if (coords.length > 10) {
            return { valid: false, error: 'Máximo 10 ciudades permitidas para evitar tiempos de cálculo excesivos.' };
        }
        
        // Check for duplicate coordinates
        const coordStrings = coords.map(c => `${c[0]},${c[1]}`);
        const uniqueCoords = new Set(coordStrings);
        if (uniqueCoords.size !== coords.length) {
            return { valid: false, error: 'No se permiten coordenadas duplicadas.' };
        }
        
        return { valid: true, coords: coords };
    } catch (error) {
        return { valid: false, error: 'Formato inválido. Use: x1,y1;x2,y2;... (ejemplo: 0,0;1,1;2,0)' };
    }
}

function validateNQueensInput(n) {
    if (!n || isNaN(n)) {
        return { valid: false, error: 'Por favor ingrese un número válido.' };
    }
    
    const num = parseInt(n);
    if (num < 4) {
        return { valid: false, error: 'N debe ser al menos 4 para tener soluciones.' };
    }
    if (num > 12) {
        return { valid: false, error: 'N máximo es 12 para evitar tiempos de cálculo excesivos.' };
    }
    
    return { valid: true, n: num };
}

function validateHashInput(m, limit) {
    if (!m || isNaN(m)) {
        return { valid: false, error: 'Por favor ingrese un tamaño de tabla hash válido.' };
    }
    if (!limit || isNaN(limit)) {
        return { valid: false, error: 'Por favor ingrese un límite de intentos válido.' };
    }
    
    const mNum = parseInt(m);
    const limitNum = parseInt(limit);
    
    if (mNum < 2) {
        return { valid: false, error: 'El tamaño de la tabla hash debe ser al menos 2.' };
    }
    if (mNum > 1000) {
        return { valid: false, error: 'Tamaño máximo de tabla hash es 1000.' };
    }
    if (limitNum < 1) {
        return { valid: false, error: 'El límite de intentos debe ser al menos 1.' };
    }
    if (limitNum > 10000) {
        return { valid: false, error: 'Límite máximo de intentos es 10000.' };
    }
    
    return { valid: true, m: mNum, limit: limitNum };
}

function validateMatrixInput(matrixA, matrixB) {
    if (!matrixA || matrixA.trim() === '') {
        return { valid: false, error: 'Por favor ingrese la matriz A.' };
    }
    if (!matrixB || matrixB.trim() === '') {
        return { valid: false, error: 'Por favor ingrese la matriz B.' };
    }
    
    try {
        const A = parseMatrix(matrixA);
        const B = parseMatrix(matrixB);
        
        if (A.length === 0 || B.length === 0) {
            return { valid: false, error: 'Las matrices no pueden estar vacías.' };
        }
        
        if (A[0].length !== B.length) {
            return { valid: false, error: `No se pueden multiplicar: A(${A.length}x${A[0].length}) × B(${B.length}x${B[0].length}). Las columnas de A deben igualar las filas de B.` };
        }
        
        if (A.length > 10 || A[0].length > 10 || B.length > 10 || B[0].length > 10) {
            return { valid: false, error: 'Tamaño máximo de matriz es 10x10 para evitar tiempos de cálculo excesivos.' };
        }
        
        return { valid: true, A: A, B: B };
    } catch (error) {
        return { valid: false, error: 'Formato de matriz inválido. Use formato: [[1,2],[3,4]]' };
    }
}

function validateSudokuInput(input) {
    if (!input || input.trim() === '') {
        return { valid: false, error: 'Por favor ingrese un tablero de Sudoku.' };
    }
    
    try {
        const board = parseSudoku(input);
        
        if (!isValidSudokuInput(board)) {
            return { valid: false, error: 'El tablero de Sudoku contiene valores inválidos que violan las reglas.' };
        }
        
        // Check if puzzle has enough clues (at least 17 for a valid Sudoku)
        let filledCells = 0;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] !== 0) filledCells++;
            }
        }
        
        if (filledCells < 17) {
            return { valid: false, error: 'Un Sudoku válido necesita al menos 17 pistas. Agregue más números.' };
        }
        
        return { valid: true, board: board };
    } catch (error) {
        return { valid: false, error: 'Formato de Sudoku inválido. Use una matriz 9x9 con números 0-9.' };
    }
}

function validateCryptogramInput() {
    // Cryptogram is a fixed problem (SEND + MORE = MONEY)
    // No user input validation needed, always valid
    return { valid: true };
}

function showValidationError(problemId, error) {
    showStatus(problemId, error, 'error');
    setTimeout(() => clearStatus(problemId), 5000);
}