# CREATE A FOLDER CALLED PLUGINS IN ~/netbox-docker/
# COPY THE CONTENTS HERE TO ~/netbox-docker/plugins/
# CREATE DOCKERFILE-PLUGINS IN ~/netbox-docker/

# DOCKERFILE-PLUGINS:

FROM netboxcommunity/netbox:latest

# repeat the last line for every plugin you want to load editable and customize the path
COPY ./plugins /plugins
RUN /opt/netbox/venv/bin/pip install --editable /plugins/plug-in- #pip install --editable /plugins/plug-in-name on macs (????)

# EDIT THE DOCKER-COMPOSE.TEST.OVERRIDE.YML FILE IN ~/netbox-docker/

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

# EDIT CONFIGURATION.PY AT ~/NETBOX-DOCKER/CONFIGURATION/CONFIGURATION.PY

# FIND PLUGINS[], UNCOMMENT IT AND ADD YOUR PLUGIN NAME I.E:
PLUGINS[
    'netbox_plugin_name',
]

# TO RUN BOTH DOCKER-COMPOSE FILES RUN THE FOLLOWING COMMANDS:

docker compose -f docker-compose.yml -f docker-compose.test.override.yml up --build (-d if you want to send it to the background)

# TO CHECK THE RESULT GO TO 127/0/0/1:8000/ADMIN/PLUGINS/ AND CHECK IF THE PLUGIN IS THERE
