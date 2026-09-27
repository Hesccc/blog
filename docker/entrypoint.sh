#!/bin/bash
set -e

# 创建持久化和缓存目录
mkdir -p /app/uploads /app/temp/images /app/temp/backups

echo "=========================================="
echo " Starting AeroNote All-in-One Service"
echo "=========================================="

# 启动 Gunicorn 监听内部端口 127.0.0.1:5000
echo "[1/2] Starting Backend API (Gunicorn)..."
gunicorn -w 4 -b 127.0.0.1:5000 --timeout 120 main:app &
GUNICORN_PID=$!

# 启动 Nginx 作为主反向代理与前端静态托管
echo "[2/2] Starting Nginx Gateway..."
nginx &
NGINX_PID=$!

echo "AeroNote is running and ready for traffic!"

# 捕获退出信号，优雅终止两个进程
trap 'echo "Stopping AeroNote..."; kill -TERM $GUNICORN_PID $NGINX_PID 2>/dev/null; exit 0' SIGTERM SIGINT

wait -n $GUNICORN_PID $NGINX_PID
