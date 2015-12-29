FROM node:4.2

RUN git clone https://github.com/Sotera/genie-ui.git genie-ui
WORKDIR /genie-ui/server/real-time
RUN npm install --production && npm cache clear
RUN npm install -g pm2

EXPOSE 3001
# redirects logs to stdout? see https://github.com/Unitech/PM2/issues/1226
CMD ["pm2", "start", ".", "--no-daemon"]
