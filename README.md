# Setup of netbox with plugins

1. Create a folder called plugins in: `~/netbox-docker/`
2. Copy the contents here to: `~/netbox-docker/plugins/`
3. Create Dockerfile-Plugins in: `~/netbox-docker/`

## DOCKERFILE-PLUGINS:

```dockerfile
FROM netboxcommunity/netbox:latest

# repeat the last line for every plugin you want to load editable and customize the path
COPY ./plugins /plugins

RUN /opt/netbox/venv/bin/pip install --editable /plugins/plug-in-name
RUN /opt/netbox/venv/bin/python /opt/netbox/netbox/manage.py collectstatic --no-input

```

## Edit the docker-compose.test.override.yml file in: ~/netbox-docker/

```yml
services:
    netbox:
        ports:
            - '127.0.0.1:8000:8080'
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
```

## Edit configuration.py and update `PLUGINS`

```python
PLUGINS = [
  "geo_map",
]
```

## To run both docker-compose files run the following commands:

```bash
$ docker compose -f docker-compose.yml -f docker-compose.test.override.yml up --build # (-d if you want to send it to the background)
```
