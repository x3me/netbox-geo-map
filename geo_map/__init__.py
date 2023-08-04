from extras.plugins import PluginConfig

class GeoMapConfig(PluginConfig):
    name = 'geo_map'
    verbose_name = 'Geo Map'
    description = 'Geo Map'
    version = '0.1'
    base_url = 'geo_map'

config = GeoMapConfig