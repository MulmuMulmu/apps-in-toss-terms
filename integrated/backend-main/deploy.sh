#!/bin/bash

# Nginx가 실행 중이지 않다면 먼저 실행
IS_NGINX_UP=$(docker ps | grep nginx)
if [ -z "$IS_NGINX_UP" ]; then
    echo ">>> Starting Nginx..."
    docker compose up -d nginx
fi

# 어느 컨테이너가 실행 중인지 확인
IS_BLUE=$(docker ps | grep blue)

if [ -z "$IS_BLUE" ]; then
  # Blue가 없으면 Blue를 시작
  echo ">>> Blue deployment starting..."
  docker compose up -d blue
  BEFORE_COLOR="green"
  AFTER_COLOR="blue"
  BEFORE_PORT=8081
  AFTER_PORT=8080
else
  # Blue가 있으면 Green을 시작
  echo ">>> Green deployment starting..."
  docker compose up -d green
  BEFORE_COLOR="blue"
  AFTER_COLOR="green"
  BEFORE_PORT=8080
  AFTER_PORT=8081
fi

# 새 컨테이너 헬스 체크
echo ">>> Waiting for $AFTER_COLOR to be healthy..."
for i in {1..15}
do
  HEALTH=$(curl -s http://localhost:$AFTER_PORT/health)
  if [ -n "$HEALTH" ]; then
    echo ">>> $AFTER_COLOR is healthy!"
    break
  fi
  echo ">>> Still waiting... ($i/15)"
  sleep 5
done

if [ -z "$HEALTH" ]; then
  echo ">>> $AFTER_COLOR health check failed. Printing logs..."
  docker compose logs $AFTER_COLOR
  echo ">>> Aborting deployment."
  docker compose stop $AFTER_COLOR
  exit 1
fi

# Nginx 트래픽 전환
echo ">>> Switching traffic to $AFTER_COLOR..."
echo "set \$service_url http://$AFTER_COLOR:$AFTER_PORT;" > ./nginx/conf.d/service-url.inc
docker compose exec -T nginx nginx -s reload

# 구버전 컨테이너 종료 (동작 중인 경우에만)
IS_BEFORE_UP=$(docker ps | grep $BEFORE_COLOR)
if [ -n "$IS_BEFORE_UP" ]; then
    echo ">>> Stopping $BEFORE_COLOR..."
    docker compose stop $BEFORE_COLOR
fi

echo ">>> Deployment completed successfully!"
