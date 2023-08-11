from extras.plugins import PluginMenu, PluginMenuItem

menu = PluginMenu(
    label="Site Map",
    icon_class="mdi mdi-map",
    groups=(
        (
            "Geo Map",
            (
                PluginMenuItem(
                    link="plugins:geo_map:home",
                    link_text="Map",
                    permissions=["dcim.view_site", "dcim.view_cable"],
                ),
            ),
        ),
    ),
)
