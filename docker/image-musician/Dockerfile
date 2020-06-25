FROM node:12.16.3
COPY src /opt/app

RUN apt-get update && \
    apt-get install -y nano

# this way the container will run node musicain.js <arg1> <arg2> ... And args will be our docker args -> docker run ... arg1 arg2 
ENTRYPOINT ["node", "/opt/app/musician.js"]
