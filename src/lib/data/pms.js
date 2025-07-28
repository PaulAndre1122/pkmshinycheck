import { getItem } from './u.js';
import pmsData from './pms.json';
import pokemonNames from './names.json';

// src/lib/data/pms.js

const today = new Date();

// Crear un mapa para buscar nombres rápidamente
const pokemonNamesMap = new Map();
pokemonNames.forEach(p => {
    const key = `${p.dex}${p.type || ''}${p.isotope || ''}`;
    pokemonNamesMap.set(key, p.name);
});


function groupByFamily(pms) {
  let pmsByFamily = pms
    .filter(pm => {
      if (!pm.shiny_released && pm.released_date) {
        pm.shiny_released =  new Date(pm.released_date) < today;
      }
      return pm.shiny_released;
    })
    .reduce((all, pm) => {
      if (!all[pm.family]) {
        all[pm.family] = {
          key: pm.family,
          pms: [],
          shiny: pm.shiny_released,
          family: pm.family,
          status: {},
        };
      }
      let dex000 = `000${pm.dex}`.slice(-3);
      pm.id = `${pm.dex}${pm.type || ''}${pm.isotope || ''}`;
      pm.fn = pm.fn || `${dex000}${pm.type || '_00'}${pm.isotope || ''}`;
      pm.status = 0;
      pm.hasShiny = false;

      const lookupKey = `${pm.dex}${pm.type || ''}${pm.isotope || ''}`;
      pm.displayName = pokemonNamesMap.get(lookupKey);

      // Si no se encuentra un nombre en el mapa, intenta derivarlo de pm.family
      if (!pm.displayName) {
          let baseName = pm.family;
          let formSuffix = '';

          // Intenta limpiar el sufijo de family (ej. _f19, _61, _11, _14, _01)
          const suffixRegex = /(_f\d+|_c\w+|_m\d+|_s\d+|_e\d+|_p\d+|_v\d+|_d\d+|_r\d+|_(\w+\d*))$/i;
          baseName = baseName.replace(suffixRegex, '');

          if (pm.type && pm.type !== '_00') {
              switch (pm.type) {
                  case '_alo': formSuffix = ' (Alola)'; break;
                  case '_gal': formSuffix = ' (Galar)'; break;
                  case '_his': formSuffix = ' (Hisui)'; break;
                  case '_pal': formSuffix = ' (Palde)'; break;
                  case '_mega': formSuffix = ' (M)'; break;
                  case '_52': formSuffix = ' (M)'; break;
                  case '_giga': formSuffix = ' (G)'; break;
                  case '_partyhat': isotope = ' (Party Hat) '; break;
                  case '_f': formSuffix = ' (Forma)'; break;
                  case '_c': formSuffix = ' (Especial)'; break;
                  default: formSuffix = ` (${pm.type.replace(/_/, '')})`;
              }
          } else if (pm.isotope && pm.isotope !== '_00') {
              switch (pm.isotope) {
                  case '_f19': formSuffix = ' (Otoño 2019)'; break;
                  case '_11': formSuffix = ' (Invierno)'; break;
                  case '_14': formSuffix = ' (Primavera)'; break;
                  case '_01': formSuffix = ' (Forma Normal)'; break; // Mantener si _01 es explícitamente "normal"
                  case '_12': formSuffix = ' (Halloween)'; break;
                  case '_13': formSuffix = ' (Verano)'; break;
                  case '_15': formSuffix = ' (Navidad)'; break;
                  case '_16': formSuffix = ' (Lunar)'; break;
                  case '_17': formSuffix = ' (Día de San Valentín)'; break;
                  case '_18': formSuffix = ' (Año Nuevo)'; break;
                  case '_19': formSuffix = ' (Pascua)'; break;
                  case '_20': formSuffix = ' (Día de la Comunidad)'; break;
                  case '_21': formSuffix = ' (Safari Zone)'; break;
                  case '_22': formSuffix = ' (Go Fest)'; break;
                  case '_23': formSuffix = ' (Intercambio)'; break;
                  case '_24': formSuffix = ' (Mega)'; break;
                  case '_25': formSuffix = ' (Giga)'; break;
                  case '_26': formSuffix = ' (Z)'; break;
                  case '_27': formSuffix = ' (X)'; break;
                  case '_28': formSuffix = ' (Y)'; break;
                  case '_29': formSuffix = ' (Noche)'; break;
                  case '_30': formSuffix = ' (Día)'; break;
                  case '_fFALL_2019': formSuffix = ' (Otoño 2019)'; break;
                  default: formSuffix = ` (${pm.isotope.replace(/_/, '')})`;
              }
          }
          pm.displayName = `${baseName}${formSuffix}`;
      }

      // Si incluso después del fallback el nombre está vacío, usar pm.family como última opción
      if (!pm.displayName || pm.displayName.trim() === '') {
          pm.displayName = pm.family;
      }

      all[pm.family].pms.push(pm);
      return all;
    }, {});

  return Object.values(pmsByFamily);
}

export const processedPokemonData = groupByFamily(pmsData);