import json
import os
import hashlib
import uuid
import requests  # 新增：用于调用 API
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 定义数据库路径
DB_PATH = '../database/'
ACCOUNTS_FILE = os.path.join(DB_PATH, 'accounts.json')

# --- 配置区 ---
# 你需要去 https://openweathermap.org/ 注册并获取免费的 API_KEY
WEATHER_API_KEY = "069c16314daa224a76672e580ab41c5e"
# 设置为重庆
CITY_NAME = "Chongqing,CN"
# ----------------
# --------------

# 确保数据库目录和账户文件存在
if not os.path.exists(DB_PATH):
    os.makedirs(DB_PATH)

if not os.path.exists(ACCOUNTS_FILE):
    with open(ACCOUNTS_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f)

# 辅助函数：读取 JSON
def read_json(filename):
    full_path = os.path.join(DB_PATH, filename)
    if not os.path.exists(full_path):
        return []
    with open(full_path, 'r', encoding='utf-8') as f:
        return json.load(f)

# 辅助函数：写入 JSON
def write_json(filename, data):
    full_path = os.path.join(DB_PATH, filename)
    with open(full_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

# 辅助函数：密码加密
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def get_real_weather_stats():
    """从第三方 API 获取真实天气并转换格式"""
    # 默认模拟数据（作为兜底）
    fallback_stats = {
        "temperature": 15, "humidity": 45, "humidityChange": 2.1,
        "aqi": 42, "aqiChange": -1.2, "visibility": 10.0, "visibilityChange": 0.5,
        "pressure": 1012, "pressureChange": 0.1, "averageTemperature": 14,
        "maximumTemperature": [12, 15, 13, 18, 22, 20, 25],
        "minimumTemperature": [8, 10, 9, 12, 14, 13, 16],
    }

    try:
        # 1. 获取当前天气 (Current Weather)
        curr_url = f"https://api.openweathermap.org/data/2.5/weather?q={CITY_NAME}&appid={WEATHER_API_KEY}&units=metric"
        curr_res = requests.get(curr_url, timeout=5).json()

        # 2. 获取空气质量 (Air Pollution)
        lat, lon = curr_res['coord']['lat'], curr_res['coord']['lon']
        aqi_url = f"https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}"
        aqi_res = requests.get(aqi_url, timeout=5).json()

        # 3. 获取预报 (Forecast - 免费版通常提供5天/3小时数据，我们提取每日极值)
        fore_url = f"https://api.openweathermap.org/data/2.5/forecast?q={CITY_NAME}&appid={WEATHER_API_KEY}&units=metric"
        fore_res = requests.get(fore_url, timeout=5).json()

        # 数据清洗与转换
        max_temps = []
        min_temps = []
        # 提取每日最高/最低温（简单处理：每8个点代表一天）
        for i in range(0, len(fore_res['list']), 8):
            day_data = fore_res['list'][i:i+8]
            max_temps.append(int(max(item['main']['temp_max'] for item in day_data)))
            min_temps.append(int(min(item['main']['temp_min'] for item in day_data)))
        real_stats = {
            "temperature": int(curr_res['main']['temp']),
            "humidity": curr_res['main']['humidity'],
            "humidityChange": 1.5, # 变化率通常需要历史数据计算，这里暂给固定值
            "aqi": aqi_res['list'][0]['main']['aqi'] * 20, # 转换成常见的 0-200 指数
            "aqiChange": 0.5,
            "visibility": round(curr_res.get('visibility', 10000) / 1000, 1), # 米转公里
            "visibilityChange": 0.2,
            "pressure": curr_res['main']['pressure'],
            "pressureChange": -0.1,
            "averageTemperature": int(sum(max_temps) / len(max_temps)) if max_temps else 15,
            "maximumTemperature": max_temps[:7], # 确保返回7天数据
            "minimumTemperature": min_temps[:7],
        }
        return real_stats

    except Exception as e:
        print(f"[!] 无法获取真实天气: {e}，将使用模拟数据。")
        return fallback_stats

# --- 路由开始 ---

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email', '')

    if not username or not password:
        return jsonify({'message': '用户名和密码不能为空'}), 400

    accounts = read_json('accounts.json')
    print(accounts)
    # 检查用户是否已存在
    if any(acc['username'] == username for acc in accounts):
        return jsonify({'message': '该用户已存在，请直接登录'}), 400

    # 录入新用户
    new_user = {
        'id': str(uuid.uuid4())[:8],
        'username': username,
        'password': hash_password(password),
        'email': email
    }
    accounts.append(new_user)
    write_json('accounts.json', accounts)

    return jsonify({'message': '身份信息录入成功'})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    accounts = read_json('accounts.json')
    hashed_pwd = hash_password(password)
    # 验证凭据
    user = next((acc for acc in accounts if acc['username'] == username and acc['password'] == hashed_pwd), None)
    if user:
        # 模拟生成一个访问 Token
        token = f"neural-core-auth-{uuid.uuid4().hex}"
        authId = user.get('id')
        return jsonify({
            'message': '认证通过',
            'token': token,
            'username': username,
            'authId':authId
        })
    else:
        return jsonify({'message': '凭证不匹配，拒绝访问'}), 401

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    # 模拟天气数据
    stats = get_real_weather_stats()

    data = {
        'stats': stats,
        'scoringList': read_json('scoringList.json'),
        'users': read_json('users.json'),
        'foods': read_json('foods.json')
    }
    return jsonify(data)

@app.route('/api/users', methods=['GET'])
def get_users_data():
    return jsonify(read_json('users.json'))

@app.route('/api/workers', methods=['GET'])
def get_workers_data():
    return jsonify(read_json('workers.json'))

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'NeuralCore Server Running'})

if __name__ == '__main__':
    print("[*] Starting Smart Nursing Home Backend...")
    print("[*] Accounts Database: " + ACCOUNTS_FILE)
    print("[*] Server running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)