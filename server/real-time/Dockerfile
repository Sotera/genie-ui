FROM node:4.2

RUN git clone https://github.com/Sotera/genie-ui.git genie-ui
WORKDIR /genie-ui/server/real-time
RUN npm install --production && npm cache clear

EXPOSE 3001
CMD ["node", "."]
