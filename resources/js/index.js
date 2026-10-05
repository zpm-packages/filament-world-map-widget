import jsVectorMap from 'jsvectormap';

/**
 * Initializes the world map widget with the given options.
 * @param {object} options - Options for initializing the map
 * @param {object} options.stats - The stats data, with country codes as keys and values as view counts
 * @param {string} options.tooltipText - Text to display next to the stats in the tooltip
 * @param {string} options.map - The name of the map to use
 * @param {string|null} options.customMapUrl - URL for a custom map script
 * @param {array} options.color - RGB array for the region color
 * @param {string} options.selector - The CSS selector for the HTML element to attach the map
 * @param {object} options.additionalOptions - Additional options to override or extend the default configuration
 */
import { loadScript } from './scriptLoader';

export default function initWorldMapWidget({ stats, tooltipText, map, customMapUrl = '', color, selector, additionalOptions = {} }) {
    return {
        stats,
        mapInstance: null,
        themeObserver: null,

        init() {
            const self = this;
            const defaultMapUrl = `https://raw.githubusercontent.com/themustafaomar/jsvectormap/master/src/maps/${map.replace(/_/g, '-')}.js`;
            const scriptUrl = typeof customMapUrl === 'string' && customMapUrl.trim() !== ''
                ? customMapUrl
                : defaultMapUrl;

            loadScript(scriptUrl, () => {
                self.renderMap();

                // Observar cambios de tema (modo claro / oscuro de Filament)
                self.themeObserver = new MutationObserver(() => {
                    self.renderMap();
                });

                self.themeObserver.observe(document.documentElement, {
                    attributes: true,
                    attributeFilter: ['class'],
                });
            });
        },

        destroy() {
            if (this.themeObserver) {
                this.themeObserver.disconnect();
                this.themeObserver = null;
            }

            if (this.mapInstance) {
                try {
                    this.mapInstance.destroy();
                } catch (e) {}
                this.mapInstance = null;
            }
        },

        renderMap() {
            const container = document.querySelector(selector);
            if (!container) return;

            if (this.mapInstance) {
                try {
                    this.mapInstance.destroy();
                } catch (e) {}
                this.mapInstance = null;
            }

            container.innerHTML = '';

            const isDarkMode = document.documentElement.classList.contains('dark');
            const dataValues = this.stats || {};

            // Filtrar únicamente regiones con valores mayores a 0
            const activeEntries = Object.entries(dataValues).filter(([_, val]) => Number(val) > 0);
            const activeValues = activeEntries.map(([_, val]) => Number(val));
            const minValue = activeValues.length > 0 ? Math.min(...activeValues) : 0;
            const maxValue = activeValues.length > 0 ? Math.max(...activeValues) : 0;

            // En modo oscuro usamos un rango de opacidad más luminoso para que no se apague contra el negro
            const minOpacity = isDarkMode ? 0.55 : 0.35;
            const maxOpacity = 1.0;

            const regionScales = Object.fromEntries(
                activeEntries.map(([code, value]) => {
                    const numVal = Number(value);
                    const t = maxValue === minValue ? 1 : (numVal - minValue) / (maxValue - minValue);
                    const opacity = minOpacity + t * (maxOpacity - minOpacity);
                    return [code, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity.toFixed(2)})`];
                })
            );

            const regionValues = Object.fromEntries(
                activeEntries.map(([code]) => [code, code])
            );

            // Base neutra: visible y estructurada en ambos modos
            const baseRegionFill = isDarkMode ? '#27272a' : '#f1f5f9';
            const baseRegionStroke = isDarkMode ? '#3f3f46' : '#cbd5e1';

            const defaultOptions = {
                selector: selector,
                map: map,
                regionStyle: {
                    initial: {
                        fill: baseRegionFill,
                        fillOpacity: 1,
                        stroke: baseRegionStroke,
                        strokeWidth: 0.75,
                        strokeOpacity: 1,
                    },
                    hover: {
                        fillOpacity: 0.85,
                        cursor: 'pointer',
                    },
                },
                series: {
                    regions: [{
                        attribute: 'fill',
                        scale: regionScales,
                        values: regionValues,
                    }]
                },
                showTooltip: true,
                onRegionTooltipShow(event, tooltip, code) {
                    const uppercaseCode = code ? code.toUpperCase() : '';
                    const lowercaseCode = code ? code.toLowerCase() : '';
                    const stats = dataValues[uppercaseCode] ?? dataValues[lowercaseCode] ?? dataValues[code] ?? 0;

                    tooltip.text(
                        `<h5>${tooltip.text()}: ${stats} ${tooltipText}</h5>`,
                        true // Enable HTML in the tooltip
                    );
                }
            };

            const mergedOptions = {
                ...defaultOptions,
                ...additionalOptions,
                regionStyle: {
                    ...defaultOptions.regionStyle,
                    ...additionalOptions.regionStyle,
                    initial: {
                        ...defaultOptions.regionStyle?.initial,
                        ...additionalOptions.regionStyle?.initial,
                    },
                    hover: {
                        ...defaultOptions.regionStyle?.hover,
                        ...additionalOptions.regionStyle?.hover,
                    },
                },
                series: {
                    regions: [
                        {
                            ...defaultOptions.series.regions[0],
                            ...additionalOptions.series?.regions?.[0],
                        }
                    ],
                },
            };

            // Inicializar el mapa
            this.mapInstance = new jsVectorMap(mergedOptions);
        }
    };
}

// Register the Alpine component
document.addEventListener('alpine:init', () => {
    Alpine.data('initWorldMapWidget', initWorldMapWidget);
});
