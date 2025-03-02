# --- STAGE 1: Base Image ---
  FROM node:20-alpine AS base

  ARG NODE_ENV=production
  ENV NODE_ENV=${NODE_ENV}
  
  WORKDIR /app
  
  # Install pnpm
  RUN npm install -g pnpm
  
  # Set up pnpm environment (Crucial for global installs)
  ENV PNPM_HOME="/root/.pnpm"
  ENV PATH="$PNPM_HOME:$PATH"
  
  # Copy package.json and pnpm-lock.yaml
  COPY package*.json pnpm-lock.yaml ./
  
  # Install dependencies needed for both build and runtime
  RUN pnpm install --frozen-lockfile
  
  # --- STAGE 2: Build Stage ---
  FROM base AS builder
  
  # Copy the application source code
  COPY . .
  
  # Install the NestJS CLI globally
  RUN pnpm install -g @nestjs/cli
  
  # Generate the Prisma client
  RUN echo "Running prisma generate..."
  RUN pnpm run prisma:generate
  RUN echo "prisma generate completed."
  
  # Build the NestJS application
  RUN echo "Starting pnpm build..."
  RUN pnpm build
  RUN echo "pnpm build completed."
  
  # --- STAGE 3: Production Image (Smaller, More Secure) ---
  FROM node:20-alpine AS production
  
  WORKDIR /app
  
  # Create the 'lokalai' user and group
  RUN addgroup -S lokalai && adduser -S lokalai -G lokalai
  
  # Copy package.json and pnpm-lock.yaml
  COPY package*.json pnpm-lock.yaml ./
  
  # Install *only* production dependencies (using npx)
  RUN npx pnpm install --frozen-lockfile --production --ignore-scripts
  
  # Copy node_modules folder from the builder stage
  COPY --from=builder --chown=lokalai:nodejs /app/node_modules ./node_modules
  
  # Copy the built application from the builder stage
  COPY --chown=lokalai:nodejs --from=builder /app/dist ./dist
  
  # Copying prisma directory...
  COPY --chown=lokalai:nodejs --from=builder /app/prisma ./prisma
  
  USER lokalai
  
  # Expose the application port
  EXPOSE 3000
  
  # Define the command to start the application
  CMD ["node","dist/src/main.js"]  