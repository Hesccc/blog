#!/bin/bash
set -e

# 创建持久化和缓存目录
mkdir -p /app/uploads /app/temp/images /app/temp/backups

echo "=========================================="
echo " Starting AeroNote All-in-One Service"
echo "=========================================="

# 等待数据库就绪（解决容器编排冷启动时数据库未完成初始化的偶发竞争问题）
if [ -n "$DB_HOST" ]; then
    PORT="${DB_PORT:-3306}"
    echo "Checking database connection at $DB_HOST:$PORT..."
    for i in {1..30}; do
        if python -c "import socket; s = socket.socket(); s.settimeout(1); s.connect(('$DB_HOST', int('$PORT'))); s.close()" 2>/dev/null; then
            echo "Database connection is ready!"
            break
        fi
        echo "Waiting for database to accept connections ($i/30)..."
        sleep 1
    done
fi

# 1. 启动 Gunicorn 监听内部端口 127.0.0.1:5000
echo "[1/2] Starting Backend API (Gunicorn)..."
gunicorn -w 4 -b 127.0.0.1:5000 --timeout 120 main:app &
GUNICORN_PID=$!

# 2. 启动 Nginx (必须带 daemon off; 以前台常驻模式运行，防止主进程退出)
echo "[2/2] Starting Nginx Gateway..."
nginx -g "daemon off;" &
NGINX_PID=$!

echo "AeroNote is running and ready for traffic!"

# 捕获退出信号，优雅终止两个进程
trap 'echo "Stopping AeroNote..."; kill -TERM $GUNICORN_PID $NGINX_PID 2>/dev/null; exit 0' SIGTERM SIGINT

# 持续守候（任何一个核心进程退出则触发容器重启机制）
wait -n $GUNICORN_PID $NGINX_PID
