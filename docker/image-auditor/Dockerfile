FROM node:12.16.3
COPY src /opt/app

RUN apt-get update && \
    apt-get install -y nano

CMD ["node", "/opt/app/auditor.js"]
