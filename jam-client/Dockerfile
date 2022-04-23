FROM node:latest

# Set the working directory
WORKDIR jam-client

COPY package.json /jam-client
COPY package-lock.json /jam-client

# Install all the dependencies
RUN npm install

RUN npm install -g @angular/cli

EXPOSE 81