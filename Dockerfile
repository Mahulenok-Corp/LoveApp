FROM node:21-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
RUN yarn tsc

# Production stage
FROM node:21-alpine
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
# Install only production dependencies
RUN yarn install --frozen-lockfile --production

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist


ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Run the compiled app
CMD ["node", "dist/app.js"]