# Create a folder called plugins in: ~/netbox-docker/
# Copy the contents here to: ~/netbox-docker/plugins/
# Create Dockerfile-Plugins in: ~/netbox-docker/

# DOCKERFILE-PLUGINS:

FROM netboxcommunity/netbox:latest

// repeat the last line for every plugin you want to load editable and customize the path
COPY ./plugins /plugins
RUN /opt/netbox/venv/bin/pip install --editable /plugins/plug-in- OR#pip install --editable /plugins/plug-in-name on macs (????)

# Edit the docker-compose.test.override.yml file in: ~/netbox-docker/

version: '3.4'
services:
  netbox:
    ports:
      - "127.0.0.1:8000:8080"
    build:
      context: .
      dockerfile: Dockerfile-Plugins
    image: netbox:latest-plugins
    volumes: 
      - ./plugins:/plugins
  netbox-worker:
    image: netbox:latest-plugins
    build:
      context: .
      dockerfile: Dockerfile-Plugins
  netbox-housekeeping:
    image: netbox:latest-plugins
    build:
      context: .
      dockerfile: Dockerfile-Plugins

# Edit configuration.py at: ~/netbox-docker/configuration/configuration.py

# Find PLGUINS[], uncomment it and add your plugin name i.e.:
PLUGINS[
    'netbox_plugin_name',
]

# To run both docker-compose files run the following commands:

docker compose -f docker-compose.yml -f docker-compose.test.override.yml up --build (-d if you want to send it to the background)

# To check the result got to 127.0.0.1:8000/admin/plugins and check if the plguin is there
