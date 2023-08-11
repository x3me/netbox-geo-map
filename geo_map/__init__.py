from extras.plugins import PluginConfig


class GeoMapConfig(PluginConfig):
    name = "geo_map"
    verbose_name = "Geo Map"
    description = "Geographical map with site locations"
    version = "0.1"
    base_url = "geo_map"
    required_settings = ["google_maps_key"]


config = GeoMapConfig
