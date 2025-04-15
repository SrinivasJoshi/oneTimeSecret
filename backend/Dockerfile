FROM node:23-alpine3.20
WORKDIR /usr/src/app
COPY package*.json ./

# Use --omit=dev to avoid installing devDependencies in production
RUN npm install --omit=dev

COPY . .
EXPOSE 9000

# Define the command to run your app using node
CMD [ "node", "src/server.js" ]