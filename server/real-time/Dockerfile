FROM node:4.2

RUN git clone https://github.com/Sotera/genie-ui.git
WORKDIR /genie-ui/server/real-time
COPY .env.template .env
RUN npm install --production && npm cache clear

EXPOSE 3001
CMD ["bash"]
