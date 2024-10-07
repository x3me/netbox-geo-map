from netbox.plugins import PluginMenu, PluginMenuItem

menu = PluginMenu(
    label="Map",
    icon_class="mdi mdi-map",
    groups=(
        (
            "Geo Map",
            (
                PluginMenuItem(
                    link="plugins:geo_map:home",
                    link_text="Map",
                    permissions=["dcim.view_site", "circuits.view_circuit", "circuits.view_provider"],
                ),
            ),
        ),
    ),
)
