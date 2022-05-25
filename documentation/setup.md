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

## AWS Setup Ubuntu
```
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt-get upgrade
sudo apt install python3-pip libmysqlclient-dev libffi-dev nginx certbot python3-certbot-nginx npm
curl https://pyenv.run | bash
<edit .bashrc as stated in the terminal>
pyenv install 3.9.13
sudo mkdir /projects; cd /projects
pyenv local 3.9.13
sudo chown ubuntu:ubuntu /projects
git clone git@github.com:TsimpDim/jam.git
cd jam/jam-api
pyenv local 3.9.13
pip3 install -r requirements.txt
python3 manage.py migrate

sudo mkdir -pv /var/{log,run}/gunicorn/
sudo chown -cR ubuntu:ubuntu /var/{log,run}/gunicorn/
```

Add the `jam-api.nginx.conf` file to `/etc/nginx/sites-available`

```
cd /etc/nginx/sites-enabled
sudo ln -s ../sites-available/jam-api .
```

Change `ssl_protocols`
```
sudo nano /etc/nginx/nginx.conf
```

Update value to
```
ssl_protocols TLSv1.2 TLSv1.3;
```

To setup HTTPS
```
sudo certbot --nginx --rsa-key-size 4096 --no-redirect
```

For the client:
```
cd /projects/jam-client
npm i
ng build
```

Add the `jam-client.nginx.conf` file to `/etc/nginx/sites-available`
```
cd /etc/nginx/sites-enabled
sudo ln -s ../sites-available/jam-client .
```

To setup HTTPS
```
sudo certbot --nginx --rsa-key-size 4096 --no-redirect
```

## AWS Setup Centos - Deprecated
```
sudo yum install git python-devel python38-devel mysql-devel gcc
sudo amazon-linux-extras install python3.8 nginx1
sudo alternatives --install /usr/bin/python3 python3 /usr/bin/python3.8 60
sudo alternatives --config python3

sudo mkdir /projects; cd /projects
sudo chown ec2-user:ec2-user /projects
git clone git@github.com:TsimpDim/jam.git
cd jam/jam-api
```

Open `~/.bashrc` and add

```
alias pip3='pip3.8'
```

```
source ~/.bashrc

pip3 install -r requirements.txt 

cd ../jam-client
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install nodejs
npm i
npm install -g npm@8.10.0
```

This settles the project and the required libraries. Now, for serving the application:

```
sudo nano /etc/systemd/system/gunicorn.socket
```

Enter:
```
[Unit]
Description=gunicorn socket

[Socket]
ListenStream=/run/gunicorn.sock

[Install]
WantedBy=sockets.target
```

And

```
sudo nano /etc/systemd/system/gunicorn.service
```

Enter:
```
[Unit]
Description=gunicorn daemon
Requires=gunicorn.socket
After=network.target

[Service]
User=jamu
Group=jamg
WorkingDirectory=/home/ec2-user/jam/jam-api
ExecStart=/home/ec2-user/.local/bin/gunicorn -c /home/ec2-user/jam/jam-api/gunicorn.conf.py


[Install]
WantedBy=multi-user.target
```

Run
```
sudo mkdir -pv /var/{log,run}/gunicorn/
sudo chown -cR ec2-user:ec2-user /var/{log,run}/gunicorn/

sudo systemctl start gunicorn.socket
sudo systemctl enable gunicorn.socket
file /run/gunicorn.sock
```

If not error message pops up, all is well.

