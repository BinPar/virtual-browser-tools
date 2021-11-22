#!/bin/bash
DOCKER_REGISTRY="402083338966.dkr.ecr.eu-west-1.amazonaws.com/virtual-browser-tools"
VERSION=$1
if [ $# -eq 0 ];
then
  VERSION=$(cat package.json | sed -En 's/"version": "(.*)",/v\1/p' | awk '{$1=$1;print}')
  echo "using package json version"
fi
echo "Building version: $VERSION"
TAG="$VERSION"
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 402083338966.dkr.ecr.eu-west-1.amazonaws.com
docker build -t virtual-browser-tools .
docker tag virtual-browser-tools "$DOCKER_REGISTRY:$TAG"
docker tag virtual-browser-tools "$DOCKER_REGISTRY:release"
docker push "$DOCKER_REGISTRY:$TAG"
docker push "$DOCKER_REGISTRY:release"
