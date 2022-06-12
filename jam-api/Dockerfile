FROM python:3.9

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt /jobappman/

WORKDIR /jobappman

RUN pip install -r requirements.txt