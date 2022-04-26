## Local Setup
### Docker Compose
To run every service that is needed you simply have to run 

`docker-compose up` in the root directory

The first time it takes some time for the DB to initialize, so after you see

`db         | 2022-04-22T18:56:10.844585Z 0 [System] [MY-010931] [Server] /usr/sbin/mysqld: ready for connections.`

You should run the command again, so that the 2nd time the API manages to connect to the DB.

Now you can access:
- Adminer at `localhost:8081` (jam-db/root/root)
- The JAA at `localhost:8001`
- The DB at `localhost:3307` (root/root)
