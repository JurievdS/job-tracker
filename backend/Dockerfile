# base node image
FROM node:20-alpine

# set working directory
WORKDIR /usr/src/app
# install app dependencies
COPY package*.json ./
RUN npm install
# copy app source code
COPY . .
# build the app
RUN npm run build
# expose the port the app runs on
EXPOSE 3001
# start the app
CMD ["npm", "start"]