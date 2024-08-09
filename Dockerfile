FROM node:18.0

# create the directory inside the container
WORKDIR /usr/src/app

# copy the package.json files from local machine to the workdir in container
COPY package*.json ./

# run npm install in our local machine
RUN npm install --force

# copy the generated modules and all other files to the container
COPY . .

# our app is running on port 5000 within the container, so need to expose it
EXPOSE 3000

# the command that starts our app
# Grant execute permission to the entry point script
RUN chmod +x entrypoint.sh

# Command to run the entry point script
CMD ["./entrypoint.sh"]


