# ==========================================
# 前端多阶段构建 Dockerfile (Node.js -> Nginx)
# ==========================================

# 阶段 1: 构建静态资源
FROM node:20-alpine AS builder

WORKDIR /app

# 先拷贝 package.json 与 lock 缓存依赖安装
COPY package.json package-lock.json* ./

RUN npm install

# 拷贝前端全部源码并执行类型检查与生产打包
COPY . .
RUN npm run build

# 阶段 2: 生产 Nginx 镜像
FROM nginx:alpine

# 拷贝构建好的前端静态产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 拷贝定制的 Nginx 配置文件 (包含反向代理与 SPA history 路由重定向)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
