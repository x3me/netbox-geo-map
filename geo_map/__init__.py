from netbox.plugins import PluginConfig


class GeoMapConfig(PluginConfig):
    name = "geo_map"
    verbose_name = "Geo Map"
    description = "Geographical map with site locations"
    version = "0.4.2"
    base_url = "geo_map"
    required_settings = ["google_maps_key"]
    


config = GeoMapConfig
