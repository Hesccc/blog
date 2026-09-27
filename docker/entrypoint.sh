#!/bin/bash
set -e

# 创建持久化和缓存目录
mkdir -p /app/uploads /app/temp/images /app/temp/backups

echo "=========================================="
echo " Starting AeroNote All-in-One Service"
echo "=========================================="

# 确保无残留 sites-enabled 配置导致 default_server 重复冲突
rm -rf /etc/nginx/sites-enabled/* /etc/nginx/sites-available/*

# 等待数据库就绪（支持 MySQL/MariaDB 3306 与 PostgreSQL 5432 双端口自动适配探测）
if [ -n "$DB_HOST" ]; then
    if [ -n "$DB_PORT" ]; then
        TARGET_PORTS=("$DB_PORT")
    elif [ "$DB_TYPE" = "postgres" ] || [ "$DB_TYPE" = "postgresql" ]; then
        TARGET_PORTS=(5432 3306)
    else
        TARGET_PORTS=(3306 5432)
    fi

    echo "Checking database connection at $DB_HOST (testing ports: ${TARGET_PORTS[*]})..."
    DB_CONNECTED=false
    for i in {1..30}; do
        for P in "${TARGET_PORTS[@]}"; do
            if python -c "import socket; s = socket.socket(); s.settimeout(1); s.connect(('$DB_HOST', int('$P'))); s.close()" 2>/dev/null; then
                echo "Database connection is ready on $DB_HOST:$P!"
                export DB_PORT=$P
                DB_CONNECTED=true
                break 2
            fi
        done
        echo "Waiting for database to accept connections ($i/30)..."
        sleep 1
    done

    if [ "$DB_CONNECTED" = false ]; then
        echo "Warning: Database did not respond within 30 seconds, proceeding anyway..."
    fi
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
