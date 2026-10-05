@use('Filament\Support\Facades\FilamentAsset')
<x-filament-widgets::widget>
    <div
        wire:key="{{ $this->getMapChecksum() }}"
        x-ignore
        x-load
        x-load-src="{{ FilamentAsset::getAlpineComponentSrc('filament-world-map-widget', 'InfinityXTech/filament-world-map-widget') }}"
        x-data="initWorldMapWidget({
            stats: @js($this->stats()),
            tooltipText: @js((string) $this->tooltip()),
            map: @js(is_string($this->map()) ? $this->map() : $this->map()->value),
            color: @js($this->color()),
            selector: @js($this->getMapSelector()),
            additionalOptions: @js($this->additionalOptions()),
            customMapUrl: @js($this->customMapUrl())
        })"
    >
        <x-filament::section>
            @if(!empty($this->heading()))
                <x-filament::section.heading>
                    {{ $this->heading() }}
                </x-filament::section.heading>
            @endif
            <div wire:ignore>
                <div id="{{ $this->getMapId() }}" style="height: {{ $this->height() }}"></div>
            </div>
        </x-filament::section>
    </div>
</x-filament-widgets::widget>
