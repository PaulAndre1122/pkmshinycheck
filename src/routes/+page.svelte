    </li>
    <li>
        <button on:click={generarEnlaceCompartir} style="width:100%;text-align:left;cursor:pointer;">
            🔗 Compartir 
        </button>
    </li>
</ul>



.share-toast {
    position: fixed;
    top: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: #2980b9;
    color: #fff;
    padding: 12px 24px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
    z-index: 4000;
    font-size: 1.1em;
}