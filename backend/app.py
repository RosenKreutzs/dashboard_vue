import json

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import time

app = Flask(__name__)#初始化 Flask 实例，它是后端的主体
CORS(app)# 允许跨域请求，方便前端（如 Vue/React）调用;(默认情况下，浏览器禁止一个域名的前端访问另一个域名的后端（同源策略）。开启 CORS 后，你的 Vue 或 React 前端才能跨域向这个 Flask 后端发送 API 请求。)



@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    # 这里模拟返回你之前 JS 里的数据结构
    stats = {
        "temperature":11,
        "humidity":2,
        "humidityChange":8.3,
        "aqi":3.6,
        "aqiChange":2.5,
        "visibility":2.1,
        "visibilityChange":15.2,
        "pressure":2.3,
        "pressureChange":2.1,
        "averageTemperature":12,
        "maximumTemperature":[12, 15, 13, 18, 22, 20, 25],
        "minimumTemperature":[8, 10, 9, 12, 14, 13, 16],
    }
    with open('../database/users.json', 'r', encoding='utf-8') as f:
        users = json.load(f)
    with open('../database/foods.json', 'r', encoding='utf-8') as f:
        foods = json.load(f)
    with open('../database/scoringList.json', 'r', encoding='utf-8') as f:
        scoringList = json.load(f)
    # 2. 合成过程：创建一个空字典并填充
    data = {}
    data['stats'] = stats
    data['scoringList'] = scoringList
    data['users'] = users
    data['foods'] = foods
    return jsonify(data)

@app.route('/api/users', methods=['GET'])
def get_users_data():
    with open('../database/users.json', 'r', encoding='utf-8') as f:
        users = json.load(f)
    return jsonify(users)
@app.route('/api/workers', methods=['GET'])
def get_workers_data():
    with open('../database/workers.json', 'r', encoding='utf-8') as f:
        workers = json.load(f)
    return jsonify(workers)

@app.route('/api/health', methods=['GET'])# 定义路径为 /api/health，仅支持 GET 请求（浏览器直接访问即可）
def health():#健康检查
    # 返回一个简单的 JSON 对象，告知前端状态正常
    # status: ok 表示服务存活，message 提供一条人类可读的消息
    return jsonify({'status': 'ok', 'message': 'Server Running'})

if __name__ == '__main__':# 只有直接运行这个 py 文件时才执行以下代码（如果被其他文件 import 则不执行）
    # 在控制台（黑窗口）打印启动提示，方便开发者确认服务器状态
    print("[*] Starting AI Vulnerability Analysis Server...")
    print("[*] Server running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)# 调用 Flask 实例的 run 方法启动 Web 服务
