import json
import os
import hashlib
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 定义数据库路径
DB_PATH = '../database/'
ACCOUNTS_FILE = os.path.join(DB_PATH, 'accounts.json')

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
    stats = {
        "temperature": 11,
        "humidity": 2,
        "humidityChange": 8.3,
        "aqi": 3.6,
        "aqiChange": 2.5,
        "visibility": 2.1,
        "visibilityChange": 15.2,
        "pressure": 2.3,
        "pressureChange": 2.1,
        "averageTemperature": 12,
        "maximumTemperature": [12, 15, 13, 18, 22, 20, 25],
        "minimumTemperature": [8, 10, 9, 12, 14, 13, 16],
    }

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