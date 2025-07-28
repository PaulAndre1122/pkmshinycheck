<script>
    export let pm;
    // Usar la ruta local de imágenes
    $: src = `/images/pokemon/${pm.fn}`;
</script>

<img
    class="pm-img"
    src={src}
    alt={pm.family || 'Pokémon'}
    {...$$restProps}
/>

<style>
    .pm-img {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 0 auto;
    }
</style>    