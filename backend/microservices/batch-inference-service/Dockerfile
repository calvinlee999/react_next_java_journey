# Batch Inference Service Docker Configuration
FROM openjdk:17-jdk-slim as builder

# Install Maven
RUN apt-get update && apt-get install -y maven

# Set working directory
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build application
RUN mvn clean package -DskipTests -B

# Production stage
FROM openjdk:17-jre-slim

# Create app user for security
RUN groupadd -r app && useradd -r -g app app

# Install required packages
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy built JAR from builder stage
COPY --from=builder /app/target/batch-inference-service-*.jar app.jar

# Create directories for data and logs
RUN mkdir -p /app/data /app/logs /app/tmp \
    && chown -R app:app /app

# Switch to app user
USER app

# Expose port
EXPOSE 8085

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8085/batch-inference/api/v1/batch-inference/health || exit 1

# Set environment variables
ENV JAVA_OPTS="-Xmx2g -Xms1g -XX:+UseG1GC -XX:+UseContainerSupport" \
    SPRING_PROFILES_ACTIVE=azure \
    TZ=UTC

# Run application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]