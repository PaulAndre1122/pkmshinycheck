<script>
        import { onMount } from 'svelte';
        import { processedPokemonData } from '$lib/data/pms.js';
        import Img from '$lib/components/Img.svelte';

        let searchTerm = ''; // Variable reactiva para el texto de búsqueda
        let pokemonFamilies = []; // Contiene todos los datos de Pokémon, incluyendo el estado de hasShiny
        let scrolled = false; // Nueva variable reactiva para el estado de scroll
            let darkMode = false;
            let showMenu = false;
        

        const LOCAL_STORAGE_KEY = 'shinyPokemonList'; // Clave para guardar en localStorage

        // Función para guardar el estado actual de los Pokémon en localStorage
        function savePokemonState() {
            const savedState = {};
            pokemonFamilies.forEach(family => {
                family.pms.forEach(pm => {
                    savedState[pm.id] = pm.hasShiny;
                });
            });
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedState));
            console.log('Estado de Pokémon guardado en localStorage.');
        }

        onMount(() => {
            // Cargar los datos iniciales procesados.
            // ¡Importante! Clonar los datos para asegurar que no mutamos la fuente original
            // y para permitir la reactividad de Svelte sobre este nuevo array.
            let initialData = JSON.parse(JSON.stringify(processedPokemonData));

            // Intentar cargar el estado guardado de localStorage
            const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                initialData.forEach(family => {
                    family.pms.forEach(pm => {
                        if (parsedState[pm.id] !== undefined) {
                            pm.hasShiny = parsedState[pm.id];
                        }
                    });
                });
                console.log('Estado de Pokémon cargado desde localStorage.');
            }

            // Asignar los datos iniciales (con o sin estado guardado).
            // Esta asignación inicial disparará el filtro reactivo.
            pokemonFamilies = initialData;
            console.log('Componente principal montado y pokemonFamilies inicializados.');
        });

                // Agrupa las formas por especie (dex)
        function groupByDex(pmsArray) {
            const grouped = {};
            pmsArray.forEach(pm => {
                if (!grouped[pm.dex]) grouped[pm.dex] = [];
                grouped[pm.dex].push(pm);
            });
            return grouped;
        }

        // Divide en subgrupos de 5
        function chunkArray(array, size) {
            const result = [];
            for (let i = 0; i < array.length; i += size) {
                result.push(array.slice(i, i + size));
            }
            return result;
        }

        // En tu componente Svelte
        $: groupedPokemon = groupByDex(filteredPokemonFamilies.flatMap(f => f.pms));
        // ESTE ES EL CAMBIO CLAVE: Declaración reactiva directa para filteredPokemonFamilies
        // No necesitas 'let filteredPokemonFamilies = [];' arriba.
        // El valor de filteredPokemonFamilies se recalculará automáticamente
        // cuando 'searchTerm' o 'pokemonFamilies' cambien.
        $: filteredPokemonFamilies = (() => {
            const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();

            return pokemonFamilies.filter(family => {
                // Filtra por generación SIEMPRE
                const gen = getGeneration(family.pms[0].dex);
                if (!selectedGenerations.includes(gen)) return false;

                // Si el campo de búsqueda está vacío, muestra todas las familias de la(s) generación(es) seleccionada(s)
                if (!lowerCaseSearchTerm) return true;

                // Filtrar por nombre de familia
                if (family.family && family.family.toLowerCase().includes(lowerCaseSearchTerm)) return true;

                // Filtrar por número de Dex
                if (family.key && family.key.toString().includes(lowerCaseSearchTerm)) return true;

                // Filtrar por nombre de cada forma (displayName)
                if (family.pms.some(pm => pm.displayName && pm.displayName.toLowerCase().includes(lowerCaseSearchTerm))) return true;

                // Filtrar por ID de forma individual
                return family.pms.some(pm =>
                    pm.id && pm.id.toLowerCase().includes(lowerCaseSearchTerm)
                );
            });
        })();

        $: totalForms = pokemonFamilies.reduce((acc, family) => acc + family.pms.length, 0);
        $: shinyCount = pokemonFamilies.reduce((acc, family) => acc + family.pms.filter(pm => pm.hasShiny).length, 0);
        $: missingCount = totalForms - shinyCount;

        // Función para alternar el estado del Pokémon y asegurar la reactividad
        function togglePokemonShiny(pokemonId) {
            let updated = false; // Bandera para verificar si se realizó una actualización

            // Mapear sobre pokemonFamilies para crear una NUEVA copia del array y objetos modificados.
            // Esto es ESENCIAL para que Svelte detecte el cambio y actualice la UI y el filtro.
            const newPokemonFamilies = pokemonFamilies.map(family => {
                // Usa 'some' para verificar si algún PM en esta familia se actualizó
                let familyUpdated = false;
                const newPms = family.pms.map(pm => {
                    if (pm.id === pokemonId) {
                        updated = true; // Se encontró y actualizó el Pokémon
                        familyUpdated = true; // La familia también fue afectada
                        return { ...pm, hasShiny: !pm.hasShiny };
                    }
                    return pm;
                });
                // Solo crear una nueva familia si sus PMs internos cambiaron
                return familyUpdated ? { ...family, pms: newPms } : family;
            });

            // Solo reasignar pokemonFamilies si realmente hubo un cambio
            // Esto previene re-renderizados innecesarios y posibles ciclos infinitos.
            if (updated) {
                pokemonFamilies = newPokemonFamilies; // ¡Esta reasignación fuerza la reactividad!
                savePokemonState(); // Guarda el estado después de cada cambio
                // console.log(`Estado de Pokémon ${pokemonId} toggled.`); // Descomenta para depurar el toggle
            } else {
                console.warn(`No se encontró el Pokémon ${pokemonId} para alternar.`);
            }
        }

        // Detectar el scroll para agregar/quitar la clase 'scrolled'
        function handleScroll() {
            if (window.scrollY > 50) {
                scrolled = true;
            } else {
                scrolled = false;
            }
        }

        onMount(() => {
            window.addEventListener('scroll', handleScroll);

            return () => {
                window.removeEventListener('scroll', handleScroll);
            };
        });

        const generations = [
            { value: 0, label: 'Todo' },
            { value: 1, label: 'Gen 1 (Kanto)' },
            { value: 2, label: 'Gen 2 (Johto)' },
            { value: 3, label: 'Gen 3 (Hoenn)' },
            { value: 4, label: 'Gen 4 (Sinnoh)' },
            { value: 5, label: 'Gen 5 (Unova)' },
            { value: 6, label: 'Gen 6 (Kalos)' },
            { value: 7, label: 'Gen 7 (Alola)' },
            { value: 8, label: 'Gen 8 (Galar)' },
            { value: 9, label: 'Gen 9 (Paldea)' }
            // ...etc
        ];
        let selectedGenerations = [1,2,3,4,5,6,7,8,9]; // Por defecto todas

        function getGeneration(dex) {
            if (dex <= 151) return 1;
            if (dex <= 251) return 2;
            if (dex <= 386) return 3;
            if (dex <= 493) return 4;
            if (dex <= 649) return 5;
            if (dex <= 721) return 6;
            if (dex <= 809) return 7;
            if (dex <= 898) return 8;
            return 9;
        }

        function toggleAllGenerations() {
            if (selectedGenerations.length === 9) {
                selectedGenerations = [];
            } else {
                selectedGenerations = [1,2,3,4,5,6,7,8,9];
            }
        }
    </script>

    <main>
        <h1> Pokémon Shiny Check List✨</h1>
        <div class="sticky-header" class:scrolled={scrolled}>
            <div class="search-container">
                <input
                    type="text"
                    bind:value={searchTerm}
                    placeholder="Buscar Pokémon (ej. Bulbasaur, Pikachu, 001)"
                    class="search-input"
                />
            </div>
        </div>
    <div class="counter-bar">
        <div class="counter-item">
            <div class="counter-number">{shinyCount}</div> 
            <div class="counter-label">Shiny<br>registrados</div>
        </div>
        <div class="counter-item">
            <div class="counter-number">{missingCount}</div>
            <div class="counter-label">Shiny<br>Faltantes</div>
        </div>
        <div class="counter-item">
            <div class="counter-number">{totalForms}</div>
            <div class="counter-label">Total<br>Shiny</div>
        </div>
    </div>
        <div class="generation-filter">
            <label>
                <input
                    type="checkbox"
                    checked={selectedGenerations.length === 9}
                    on:change={toggleAllGenerations}
                />
                Todo
            </label>
            {#each generations.slice(1) as gen}
                <label>
                    <input
                        type="checkbox"
                        value={gen.value}
                        bind:group={selectedGenerations}
                    />
                    {gen.label}
                </label>
            {/each}
        </div>

<div class="pokemon-grid">
    {#each filteredPokemonFamilies as family}
        {#each chunkArray(family.pms, 5) as pmGroup}
            <div class="pokemon-card">
                <div class="forms-container {pmGroup.length < 6 ? 'centered' : ''}">
                    {#each pmGroup as individualPm (individualPm.id)}
                        <div
                            class="individual-form"
                            class:marked={individualPm.hasShiny}
                            on:click={() => {
                                individualPm.hasShiny = !individualPm.hasShiny;
                                savePokemonState();
                            }}
                            on:keydown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    individualPm.hasShiny = !individualPm.hasShiny;
                                    savePokemonState();
                                }
                            }}
                            tabindex="0"
                            role="button"
                        >
                            <span class="dex-number">#{individualPm.dex}</span>
                            <Img pm={individualPm} />
                            <p>{individualPm.displayName}</p>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    {/each}
    {#if filteredPokemonFamilies.length === 0 && searchTerm.length > 0}
        <p class="no-results">No se encontraron Pokémon para "{searchTerm}".</p>
    {/if}
</div>

        <button
            class="scroll-to-top"
            on:click={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Ir al inicio"
            style:display={scrolled ? 'block' : 'none'}
        >
            ⬆️
        </button>

        <!-- Menú hamburguesa y opciones -->
<div class="menu-container"> 
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <button class="menu-btn" on:click={() => showMenu = !showMenu}> 
        <span class="menu-icon">
            <span></span> <!-- Línea 1 -->
            <span></span> <!-- Línea 2 -->
            <span></span> <!-- Línea 3 -->
        </span> 
    </button>
    {#if showMenu}
        <div class="menu-dropdown">
           <!-- <label>
                 <input type="checkbox" bind:checked={darkMode} /> -->
         <!-- </div>
            </label> -->
            <!-- Puedes agregar más opciones aquí -->
        </div>
    {/if}
</div>
    </main>


    <style>
        /* Estilos generales para el cuerpo y la fuente principal */
        :global(body) {
            font-family: 'Open Sans', sans-serif; /* Fuente para todo el texto */
            margin: 0;
            background-color: #f0f2f5; /* Un gris claro suave para el fondo */
            color: #333; /* Color de texto oscuro para legibilidad */
        }

        /* Estilos para el encabezado principal */
        h1 {
            font-family: 'Montserrat', sans-serif; /* Fuente más fuerte para títulos */
            color: #2c3e50; /* Azul oscuro */
            text-align: center;
            margin-top: 30px;
            margin-bottom: 20px;
            font-size: 2.5em; /* Tamaño grande para el título */
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }

        /* Estilos para la barra de búsqueda */
        .search-container {
            text-align: center;
            margin-bottom: 50px;
            padding: 10px;
            background: rgba(255,255,255,0.6); /* Fondo blanco semitransparente */
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08); /* Sombra suave */
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            backdrop-filter: blur(1px); /* Difumina el fondo detrás */
            -webkit-backdrop-filter: blur(1px); /* Compatibilidad Safari */
        }

        .search-input {
            width: 500px;
            padding: 5px;
            border: 2px solid #bb9962;
            border-radius: 8px;
            font-size: 1.1em;
            outline: none;
            transition: border-color 0.3s ease;
            background: rgba(255, 255, 255, 0.251); /* Fondo blanco semitransparente */
            backdrop-filter: blur(1px); /* Difumina el fondo detrás */
            -webkit-backdrop-filter: blur(1px); /* Compatibilidad Safari */
        }

        .search-input:focus {
            border-color: #2980b9; /* Borde más oscuro al enfocar */
            box-shadow: 0 0 8px rgba(52, 152, 219, 0.3);
        }

        /* Estilos para el encabezado fijo */
        .sticky-header {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: none;
            box-shadow: none;
            padding: 0;
            transition: none;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .sticky-header.scrolled {
            background: none;
            box-shadow: none;
            padding: 0;
        }

        /* Barra de contador para estadísticas */
        .counter-bar {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-bottom: 20px;
            font-size: 1.2em;
            color: #2c3e50;
            border-radius: 8px;
            padding: 10px 0;
        }

        .counter-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .counter-number {
            font-size: 2em;
            font-weight: bold;
            line-height: 1;
            margin-bottom: 2px;
        }

        .counter-label {
            font-size: 1em;
            color: #555;
            text-align: center;
            width: 100%;
        }

        /* Contenedor principal de la lista de Pokémon */
        .pokemon-list {
            display: grid; /* Usamos CSS Grid para un diseño de rejilla */
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* Columnas responsivas */
            gap: 25px; /* Espacio entre las tarjetas */
            padding: 20px;
            max-width: 1200px; /* Ancho máximo del contenedor */
            margin: 0 auto 50px auto; /* Centrar y margen inferior */
        }

        /* Estilos para cada tarjeta de Pokémon (la "familia") fondo barra blanca */
        .pokemon-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: #ffffff;
            border-radius: 50px; /* Bordes redondeados */
            box-shadow: 0 6px 20px rgba(0,0,0,0.1); /* Sombra más pronunciada */
            padding: 10px; /* tamaño altura frnaja blanca fondo */
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            cursor: default; /* No es clickeable directamente */
        }

        .pokemon-card:hover {
            transform: translateY(-5px); /* Efecto de "levantar" al pasar el ratón */
            box-shadow: 0 10px 30px rgba(0,0,0,0.15); /* Sombra más grande al pasar el ratón */
        }

        .pokemon-card h2 {
            font-family: 'Montserrat', sans-serif;
            font-size: 1.8em; /* Títulos de familia un poco más grandes */
            color: #34495e; /* Un gris azulado */
            margin-top: 10px;
            margin-bottom: 15px;
            text-align: center;
        }

        .pokemon-card p {
            font-size: 0.9em;
            color: #777;
            margin-top: 0;
            margin-bottom: 5px;
        }

        /* Contenedor de las diferentes formas (horizontal scroll) */
        .forms-container {
            display: flex;
            overflow-x: auto; /* Permite el scroll horizontal */
            width: 100%;/* esacio utilizable */
            padding-bottom: 10px; /* Espacio para la barra de scroll */
            gap: 10px; /* Espacio entre las formas individuales */
            scroll-snap-type: x proximity; /* Para que se "pegue" al scroll */
            -webkit-overflow-scrolling: touch; /* Suaviza el scroll en iOS */
        /* Esconder la barra de scroll, pero aún así se puede arrastrar */
            scrollbar-width: auto; /* Firefox */
            -ms-overflow-style: none;  /* Internet Explorer 10+ */
            justify-content: flex-start; /* <-- Cambia a flex-start */
            align-items: center; /* Centra los elementos verticalmente (útil si las formas tienen diferentes alturas) */
        }

        .forms-container.centered {
            justify-content: center;
        }

        .forms-container::-webkit-scrollbar {
            display: none;
        }

        /* Cada forma individual de Pokémon nombres y el tamaño del cuadro */
        .individual-form {
            flex-shrink: 0; /* Evita que se encoja */
            display: flex;
            flex-direction: column;
            align-items: center;
            font-size: 0.85em; /* Tamaño de fuente nombre*/
            color: #555;
            scroll-snap-align: start;
            padding: 10px;
            border: 2px solid #ecf0f1; /* Borde gris claro */
            border-radius: 10px;
            background-color: #fdfdfd;
            cursor: pointer;
            user-select: none;
            box-shadow: 0 4px 16px rgba(0,0,0,0.10); /* Sombra suave */
            transition: 
                background-color 0.2s ease-in-out, 
                border-color 0.2s ease-in-out, 
                box-shadow 0.2s ease-in-out,
                transform 0.2s ease-in-out; /* Añade transición para transform */
            outline: none;
            transform: scale(.9); /* Ligeramente más grande  tamaño del cuadro*/
        }

        /* Fondo de la imagen gris y el aumento */

        .individual-form:hover {
            background-color: #e0e6eb; /* Fondo ligeramente gris al pasar el ratón */
            border-color: #bdc3c7;
            transform: scale(1.00) translateY(0px); /* Elevación y escala suave */
            box-shadow: 0 8px 24px rgba(0,0,0,0.12); /* Sombra más pronunciada en hover */
        }

        /* Estilo para la imagen del Pokémon */
        .pm-img {
            width: 100px; /* Aumenta el tamaño de la imagen */
            height: 100px;
            object-fit: contain; /* Asegura que la imagen se vea completa */
            margin-bottom: 5px; /* Espacio debajo de la imagen */
            border-radius: 12px; /* Redondea la imagen */
        border: 1px solid #eee; /* Borde suave para la imagen */

        }

        .individual-form p {
            margin: 5px 0 0 0; /* Espacio superior para separar de la imagen */
            white-space: normal; /* Permite el salto de línea */
            word-wrap: break-word; /* Rompe palabras largas */
            text-align: center; /* Centra el texto si se envuelve */
            line-height: 1.2; /* Ajusta el interlineado si se ve muy apretado */

            max-width: 100px; /* Puedes ajustar este valor si el nombre se ve demasiado estrecho,
                                o si quieres que ocupe más ancho dentro del contenedor.
                                Experimenta con 90px, 100px, 110px. */
            font-size: 0.8em; /* Puedes reducir un poco el tamaño de la fuente si aún no cabe */
            max-width: 150px; /* Limita el ancho del texto */
            text-align: center; /* Centra el texto */
            font-size: 1.50em; /* Puedes ajustar el tamaño si es necesario */
            color: #555; /* Color de texto */
        }

        /* Estilo cuando una forma es marcada como "shiny y el tamaño del fondo verde" */
        .individual-form.marked {
            background-color: #d4edda; /* Verde claro */
            border-color: #28a745; /* Verde más oscuro */
            box-shadow: 0 0 10px rgba(40, 167, 69, 0.5); /* Sombra verde */
            transform: scale(1.00); /* Ligeramente más grande cuando está marcado */
            transition: 
                background-color 0.2s ease-in-out, 
                border-color 0.2s ease-in-out, 
                box-shadow 0.2s ease-in-out,
                transform 0.2s ease-in-out; /* Transición suave al marcar */
        }

        /* Botón para volver al inicio */
        .scroll-to-top {
            position: fixed;
            right: 30px;
            bottom: 30px;
            z-index: 2000;
            background: none;
            color: #3498db; /* O el color que prefieras para el emoji */
            border: none;
            border-radius: 0;
            width: auto;
            height: auto;
            font-size: 2.5em;
            cursor: pointer;
            box-shadow: none;
            transition: none;
            display: none;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .scroll-to-top:hover {
            background: rgba(255,255,255,0.6);
        }

        /* Estilos para el filtro de generaciones */
        .generation-filter {
            text-align: center;
            margin-bottom: 40px;
            padding: 10px;
            background: rgba(255,255,255,0.6); /* Fondo blanco semitransparente */
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08); /* Sombra suave */
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
            backdrop-filter: blur(1px); /* Difumina el fondo detrás */
            -webkit-backdrop-filter: blur(1px); /* Compatibilidad Safari */
        }

        .generation-filter label {
            margin-right: 15px;
            font-size: 1em;
            color: #2c3e50;
            white-space: nowrap;
            display: inline-block;
        }

        .generation-filter input {
            margin-right: 5px;
            transform: scale(1.2);
            cursor: pointer;
        }
        
        .dex-number {
            position: absolute;
            top: 8px;
            right: 12px;
            font-size: 1em;
            font-weight: bold;
            color: #888;
            background: rgba(255,255,255,0.85);
            padding: 2px 8px;
            border-radius: 12px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.07);
            pointer-events: none;
        }

        /* Asegúrate que individual-form sea relative para el posicionamiento absoluto */
        .individual-form {
        position: relative;

        }

                /* Estilos para el menú hamburguesa */
        .menu-container { /* Estilo del contenedor del menú */
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 3000;
        }
        .menu-btn { /* Estilo del botón hamburguesa */
            background: #170a0a1b;
            backdrop-filter: blur(5px); /* Difumina el fondo detrás */
            border: none;
            border-radius: 8px;
            padding: 10px;
            cursor: pointer;
        }
        .menu-icon { /* Icono hamburguesa */
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 6px; /* Espacio entre líneas */
            width: 32px;
            height: 32px;
        }
        .menu-dropdown { /* Menú desplegable */
            margin-top: 10px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            padding: 12px;
        }
        body.dark { /* Modo oscuro para el body */
            background: #181818;
            color: #eee;
        }    
            
        .menu-icon span { /* Cada línea */
            display: block;
            width: 24px;
            height: 3px;
            background: #000000;
            border-radius: 2px;
        }
            
        @keyframes shiny-glow {
            0% {
                box-shadow: 0 0 0px 0px #fff700, 0 0 0px 0px #28a745;
            }
            50% {
                box-shadow: 0 0 20px 8px #fff700, 0 0 40px 16px #28a745;
            }
            100% {
                box-shadow: 0 0 0px 0px #fff700, 0 0 0px 0px #28a745;
            }
        }

        .individual-form.marked {
            animation: shiny-glow 0.7s;
        }

        @media (max-width: 600px) {
        .forms-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 8px; /* Reducido el espacio entre las tarjetas */
            padding-bottom: 0;
            overflow-x: unset !important;
            width: 100%;
            max-width: 100%;
        }

        .pokemon-card {
            max-width: 100%;
            min-width: 0;
            padding: 5px; /* Reducido el padding */
            border-radius: 12px; /* Reducido el border-radius */
        }

        .individual-form {
            max-width: 50px; /* Reducido el ancho máximo */
            min-width: 60;
            padding: 16px; /* Reducido el padding */
            font-size: 0.60em; /* Reducido el tamaño de la fuente */
            height: 70px; /* Limita la altura total de la card */
            font-weight: bold;
        }

        .pm-img {
            width: 120px;
            height: 120px;
            
        }

        .individual-form p {
            font-size: 0.85em; /* Reducido el tamaño de la fuente */
            max-width: 200px; /* Reducido el ancho máximo */
        }

        .dex-number {
        font-size: 0.7em;
        padding: 1px 5px;
        top: 4px;
        right: 6px;
        
        }
        h1 {
            font-size: 1.19em;
            margin-top: 12px;
            margin-bottom: 10px;
        }
        .search-container {
            padding: 4px;
            margin-bottom: 9px;
            max-width: 98vw;
        }
        .search-input {
            width: 40vw;
            font-size: 0.5em;
            padding: 4px;
        }
        .counter-bar {
            gap: 10px;
            font-size: 0.9em;
            padding: 4px 0;
            margin-bottom: 10px;
        }
        .counter-number {
            font-size: 1.2em;
        }
        .counter-label {
            text-align: center;
            width: 100%;
            font-size: 0.5em;
        }
        .generation-filter {
            font-size: 0.7em;
            padding: 6px;
            margin-bottom: 18px;
            max-width: 98vw;
        
        }
        .generation-filter label {
            margin-right: 6px;
            font-size: 0.90em;
        }
        .generation-filter input {
            transform: scale(0.90);
        }
        .menu-container {
            top: 10px;
            left: 5px;
        }
        .menu-btn {
            padding: 6px;
        }
        .menu-icon {
            width: 22px;
            height: 22px;
            gap: 3px;
        }
        .menu-icon span {
            width: 16px;
            height: 2px;
        }
        .scroll-to-top {
            right: 10px;
            bottom: 10px;
            font-size: 1.5em;
        }
        .counter-label br { display: inline; }
        /* Agranda solo la imagen del Pokémon central en cada fila */
        .forms-container .individual-form:nth-child(5) .pm-img {
            width: 200px !important;
            height: 200px !important;
        }
    }
</style>
