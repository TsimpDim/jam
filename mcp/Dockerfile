FROM python:3.10

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt /jam-mcp/
COPY server.py /jam-mcp/

WORKDIR /jam-mcp

RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN apt update && apt install nodejs npm -y