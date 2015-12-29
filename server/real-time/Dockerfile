FROM node:4.2

RUN git clone https://github.com/Sotera/genie-ui.git genie-ui
RUN apt-get update && apt-get install -y --no-install-recommends vim-tiny
WORKDIR /genie-ui/server/real-time
COPY .env.template .env
RUN npm install --production && npm cache clear

EXPOSE 3001
CMD ["node", "."]
