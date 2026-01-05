#!/bin/bash
set -e

# Define image name
IMAGE_NAME="codename-test-env"

# Build the Docker image
echo "Building Docker image: $IMAGE_NAME..."
docker build -f Dockerfile.test -t $IMAGE_NAME .

# Run the tests
echo "Running tests in Docker container..."
docker run --rm $IMAGE_NAME
