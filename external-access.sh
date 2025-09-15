#!/bin/bash

echo "=== 外网访问解决方案 ==="
echo ""

echo "当前应用状态："
ps aux | grep "next dev" | grep -v grep
echo ""

echo "网络接口："
ip addr show | grep "inet " | grep -v "127.0.0.1"
echo ""

echo "当前监听端口："
netstat -tlnp | grep :3000
echo ""

echo "=== 可用的访问方式 ==="
echo "1. 本地访问：http://localhost:3000"
echo "2. 内网访问：http://192.168.0.78:3000"
echo "3. 公网访问：http://166.108.192.6:3000"
echo ""

echo "=== 如果公网无法访问，请检查 ==="
echo "1. 路由器是否设置了端口转发（3000端口 -> 192.168.0.78:3000）"
echo "2. 防火墙是否允许3000端口"
echo "3. 云服务器安全组是否开放3000端口"
echo ""

echo "=== 使用SSH隧道（推荐） ==="
echo "在本地电脑运行："
echo "ssh -L 3000:localhost:3000 username@166.108.192.6"
echo "然后访问：http://localhost:3000"
echo ""

echo "=== 使用localtunnel（临时） ==="
read -p "是否要使用localtunnel创建临时外网访问？(y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "正在创建localtunnel隧道..."
    lt --port 3000
fi