#!/bin/bash

REPO_OWNER=415505189627.dkr.ecr.ap-south-1.amazonaws.com/nsa
# Get the list of changed packages
CHANGED_PACKAGES=($(npx lerna changed --all --parseable))

# Iterate through the changed packages and build their Docker images
for PACKAGE_DIR in "${CHANGED_PACKAGES[@]}"; do
  PACKAGE_NAME=$(basename "$PACKAGE_DIR")
  if [[ -f "$PACKAGE_DIR/Dockerfile" ]]; then
      # Build the Docker image
      PACKAGE_VERSION=$(jq -r '.version' "$PACKAGE_DIR/package.json")
      echo "Building Docker image for package: nsa-$PACKAGE_NAME:$PACKAGE_VERSION"
      docker build -t "$REPO_OWNER-$PACKAGE_NAME:$PACKAGE_VERSION" -f packages/${PACKAGE_NAME}/Dockerfile .
#      docker push "$REPO_OWNER-$PACKAGE_NAME:$PACKAGE_VERSION"
  else
    echo "Skipping package without Dockerfile: $PACKAGE_NAME"
  fi
done