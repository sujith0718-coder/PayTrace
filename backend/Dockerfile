# ==============================================================================
# PayTrace Backend — Multi-stage Production Dockerfile for Render Deployment
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Environment
# Uses Maven 3.9.9 with Eclipse Temurin JDK 21
# ------------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /build

# Optimize build caching: copy pom.xml first to pre-fetch dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy full application source tree
COPY src ./src

# Compile and package Spring Boot executable fat JAR (skipping test execution)
RUN mvn clean package -DskipTests

# ------------------------------------------------------------------------------
# Stage 2: Production Minimal Runtime Environment
# Uses Eclipse Temurin JRE 21 on lightweight Ubuntu Jammy
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-jammy

# Security hardening: Create non-privileged system user & group
RUN groupadd -r paytrace && useradd -r -g paytrace -m -d /home/paytrace paytrace

WORKDIR /app

# Copy packaged executable JAR from builder stage
COPY --from=builder /build/target/paytrace-backend-*.jar app.jar

# Enforce secure file ownership
RUN chown -R paytrace:paytrace /app

# Switch to non-root user
USER paytrace

# Render dynamically assigns PORT at container runtime (defaults to 10000 on free tier)
ENV PORT=10000
EXPOSE ${PORT}

# Render Free Tier Memory Optimization (512MB RAM cap):
# Limit heap to 75% of container RAM (~384MB) to prevent OOM termination (exit code 137)
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

# Execute Spring Boot application with dynamic port assignment
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dserver.port=${PORT} -jar app.jar"]

