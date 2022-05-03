## Services
There are threee services that JAM consists of:
- API (backend)
- Client (frontend)
- Core (db)

These all exist in this repo, but are handled indepedenly.

## Local Setup
### Docker Compose
To run each service simply run `./scripts/ctrl.sh start [api|client|core]`

The first time it takes some time for the DB to initialize, so after you see

`db         | 2022-04-22T18:56:10.844585Z 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections.`

You should start the API again, so that the 2nd time it manages to connect to the DB.

Now you can access:
- Adminer at `localhost:8081` (jam-db/root/root)
- The JAM-Client at `localhost:81`
- The JAM-Api at `localhost:8001`
- The DB at `localhost:3307` (root/root)

### Migrations
To run API migrations log inside the container

`docker exec -ti jobappman-api sh`

and run

`python3 manage.py migrate jam`