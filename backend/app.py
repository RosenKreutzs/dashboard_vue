import json
import os
import hashlib
import uuid
import datetime
import requests  # 新增：用于调用 API
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

VALID_TOKENS = set()
TOKEN_USER_MAP = {}  # token -> user_id 的映射

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'message': '未授权访问'}), 401
        token = auth_header.removeprefix('Bearer ').strip()
        # 先检查内存缓存
        if token in VALID_TOKENS:
            return f(*args, **kwargs)
        # 再从 accounts.json 查找（服务器重启后兜底）
        accounts = read_json('accounts.json')
        if any(a.get('token') == token for a in accounts):
            VALID_TOKENS.add(token)  # 加入缓存
            return f(*args, **kwargs)
        return jsonify({'message': '凭证无效或已过期'}), 401
    return wrapper

def get_current_user_id():
    """从请求头中提取token并返回对应的user_id"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    token = auth_header.removeprefix('Bearer ').strip()
    # 先查内存缓存
    if token in TOKEN_USER_MAP:
        return TOKEN_USER_MAP[token]
    # 再从 accounts.json 查找（服务器重启后兜底）
    accounts = read_json('accounts.json')
    user = next((a for a in accounts if a.get('token') == token), None)
    if user:
        TOKEN_USER_MAP[token] = user['id']  # 加入缓存
        return user['id']
    return None

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
        # 生成一个访问 Token 并持久化到 accounts.json
        token = f"neural-core-auth-{uuid.uuid4().hex}"
        VALID_TOKENS.add(token)
        TOKEN_USER_MAP[token] = user['id']
        # 将 token 写入 accounts.json，服务器重启后仍可验证
        user['token'] = token
        write_json('accounts.json', accounts)
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

# 辅助函数：生成用户ID (格式: 202602160XXX)
def generate_user_id(users):
    prefix = '202602160'
    max_num = 0
    for user in users:
        uid = user.get('id', '')
        if uid.startswith(prefix) and uid[len(prefix):].isdigit():
            max_num = max(max_num, int(uid[len(prefix):]))
    return f"{prefix}{max_num + 1:03d}"

# 辅助函数：生成护工ID (格式: A0XXX)
def generate_worker_id(workers):
    prefix = 'A0'
    max_num = 0
    for worker in workers:
        wid = worker.get('id', '')
        if wid.startswith(prefix) and wid[len(prefix):].isdigit():
            max_num = max(max_num, int(wid[len(prefix):]))
    return f"{prefix}{max_num + 1:03d}"

@app.route('/api/users', methods=['GET'])
def get_users_data():
    return jsonify(read_json('users.json'))

@app.route('/api/users', methods=['POST'])
@require_auth
def create_user():
    data = request.json or {}
    required_fields = ['name', 'sex', 'age', 'telephoneNumber', 'actionCapability', 'bunk']
    missing = [f for f in required_fields if f not in data or data[f] == '']
    if missing:
        return jsonify({'message': f'缺少必填字段: {", ".join(missing)}'}), 400

    users = read_json('users.json')
    new_user = {
        'id': generate_user_id(users),
        'name': data['name'],
        'sex': data['sex'],
        'age': data['age'],
        'telephoneNumber': data['telephoneNumber'],
        'actionCapability': data['actionCapability'],
        'bunk': data['bunk']
    }
    # 添加可选字段
    for key in data:
        if key not in new_user:
            new_user[key] = data[key]

    users.append(new_user)
    write_json('users.json', users)
    return jsonify({'message': '新增成功', 'data': new_user})

@app.route('/api/users/<user_id>', methods=['PUT'])
@require_auth
def update_user(user_id):
    data = request.json or {}
    users = read_json('users.json')
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return jsonify({'message': '用户不存在'}), 404

    for key, value in data.items():
        if key != 'id':
            user[key] = value

    write_json('users.json', users)
    return jsonify({'message': '更新成功', 'data': user})

@app.route('/api/users/<user_id>', methods=['DELETE'])
@require_auth
def delete_user(user_id):
    users = read_json('users.json')
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return jsonify({'message': '用户不存在'}), 404

    users.remove(user)
    write_json('users.json', users)
    return jsonify({'message': '删除成功'})

@app.route('/api/workers', methods=['GET'])
def get_workers_data():
    return jsonify(read_json('workers.json'))

@app.route('/api/workers', methods=['POST'])
@require_auth
def create_worker():
    data = request.json or {}
    required_fields = ['name', 'sex', 'age', 'telephoneNumber']
    missing = [f for f in required_fields if f not in data or data[f] == '']
    if missing:
        return jsonify({'message': f'缺少必填字段: {", ".join(missing)}'}), 400

    workers = read_json('workers.json')
    new_worker = {
        'id': generate_worker_id(workers),
        'name': data['name'],
        'sex': data['sex'],
        'age': data['age'],
        'telephoneNumber': data['telephoneNumber']
    }
    # 添加可选字段
    for key in data:
        if key not in new_worker:
            new_worker[key] = data[key]

    workers.append(new_worker)
    write_json('workers.json', workers)
    return jsonify({'message': '新增成功', 'data': new_worker})

@app.route('/api/workers/<worker_id>', methods=['PUT'])
@require_auth
def update_worker(worker_id):
    data = request.json or {}
    workers = read_json('workers.json')
    worker = next((w for w in workers if w['id'] == worker_id), None)
    if not worker:
        return jsonify({'message': '护工不存在'}), 404

    for key, value in data.items():
        if key != 'id':
            worker[key] = value

    write_json('workers.json', workers)
    return jsonify({'message': '更新成功', 'data': worker})

@app.route('/api/workers/<worker_id>', methods=['DELETE'])
@require_auth
def delete_worker(worker_id):
    workers = read_json('workers.json')
    worker = next((w for w in workers if w['id'] == worker_id), None)
    if not worker:
        return jsonify({'message': '护工不存在'}), 404

    workers.remove(worker)
    write_json('workers.json', workers)
    return jsonify({'message': '删除成功'})

# 辅助函数：生成菜品ID (格式: YYYYMMDD + A/B/C + 4位序号)
def generate_food_id(foods, time_str, meal):
    meal_map = {'早餐': 'A', '午餐': 'B', '晚餐': 'C'}
    meal_prefix = meal_map.get(meal, 'A')
    # time_str 格式: YYYY/MM/DD
    date_part = time_str.replace('/', '')
    prefix = f"{date_part}{meal_prefix}"
    max_num = 0
    for food in foods:
        fid = food.get('id', '')
        if fid.startswith(prefix) and fid[len(prefix):].isdigit():
            max_num = max(max_num, int(fid[len(prefix):]))
    return f"{prefix}{max_num + 1:04d}"

# 辅助函数：生成活动ID (格式: ACTYYYYMMDD + 3位序号)
def generate_activity_id(activities, date_str):
    # date_str 格式: YYYY/MM/DD
    date_part = date_str.replace('/', '')
    prefix = f"ACT{date_part}"
    max_num = 0
    for activity in activities:
        aid = activity.get('id', '')
        if aid.startswith(prefix) and aid[len(prefix):].isdigit():
            max_num = max(max_num, int(aid[len(prefix):]))
    return f"{prefix}{max_num + 1:03d}"

@app.route('/api/foods', methods=['GET'])
def get_foods_data():
    return jsonify(read_json('foods.json'))

@app.route('/api/foods', methods=['POST'])
@require_auth
def create_food():
    data = request.json or {}
    required_fields = ['name', 'time', 'meal', 'grease', 'greaseLevel', 'description']
    missing = [f for f in required_fields if f not in data or data[f] == '']
    if missing:
        return jsonify({'message': f'缺少必填字段: {", ".join(missing)}'}), 400

    foods = read_json('foods.json')
    new_food = {
        'id': generate_food_id(foods, data['time'], data['meal']),
        'name': data['name'],
        'time': data['time'],
        'meal': data['meal'],
        'grease': data['grease'],
        'greaseLevel': data['greaseLevel'],
        'description': data['description']
    }
    # 添加可选字段
    for key in data:
        if key not in new_food:
            new_food[key] = data[key]

    foods.append(new_food)
    write_json('foods.json', foods)
    return jsonify({'message': '新增成功', 'data': new_food})

@app.route('/api/foods/<food_id>', methods=['PUT'])
@require_auth
def update_food(food_id):
    data = request.json or {}
    foods = read_json('foods.json')
    food = next((f for f in foods if f['id'] == food_id), None)
    if not food:
        return jsonify({'message': '菜品不存在'}), 404

    for key, value in data.items():
        if key != 'id':
            food[key] = value

    write_json('foods.json', foods)
    return jsonify({'message': '更新成功', 'data': food})

@app.route('/api/foods/<food_id>', methods=['DELETE'])
@require_auth
def delete_food(food_id):
    foods = read_json('foods.json')
    food = next((f for f in foods if f['id'] == food_id), None)
    if not food:
        return jsonify({'message': '菜品不存在'}), 404

    foods.remove(food)
    write_json('foods.json', foods)
    return jsonify({'message': '删除成功'})

@app.route('/api/activities', methods=['GET'])
def get_activities():
    activities = read_json('activities.json')
    activities.sort(key=lambda x: x.get('date', ''), reverse=True)
    return jsonify(activities)

@app.route('/api/activities', methods=['POST'])
@require_auth
def create_activity():
    data = request.json or {}
    required_fields = ['title', 'date', 'time', 'location', 'description']
    missing = [f for f in required_fields if f not in data or data[f] == '']
    if missing:
        return jsonify({'message': f'缺少必填字段: {", ".join(missing)}'}), 400

    activities = read_json('activities.json')
    now = datetime.datetime.now()
    created_at = now.strftime('%Y/%m/%d %H:%M')
    new_activity = {
        'id': generate_activity_id(activities, data['date']),
        'title': data['title'],
        'date': data['date'],
        'time': data['time'],
        'location': data['location'],
        'description': data['description'],
        'photos': [],
        'createdAt': created_at
    }

    activities.append(new_activity)
    write_json('activities.json', activities)
    return jsonify({'message': '新增成功', 'data': new_activity})

@app.route('/api/activities/<activity_id>', methods=['PUT'])
@require_auth
def update_activity(activity_id):
    data = request.json or {}
    activities = read_json('activities.json')
    activity = next((a for a in activities if a['id'] == activity_id), None)
    if not activity:
        return jsonify({'message': '活动不存在'}), 404

    for key, value in data.items():
        if key not in ('id', 'photos', 'createdAt'):
            activity[key] = value

    write_json('activities.json', activities)
    return jsonify({'message': '更新成功', 'data': activity})

@app.route('/api/activities/<activity_id>', methods=['DELETE'])
@require_auth
def delete_activity(activity_id):
    activities = read_json('activities.json')
    activity = next((a for a in activities if a['id'] == activity_id), None)
    if not activity:
        return jsonify({'message': '活动不存在'}), 404

    for photo in activity.get('photos', []):
        photo_path = os.path.join(ACTIVITY_UPLOADS_DIR, photo)
        try:
            if os.path.exists(photo_path):
                os.remove(photo_path)
        except Exception:
            pass

    activities.remove(activity)
    write_json('activities.json', activities)
    return jsonify({'message': '删除成功'})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'NeuralCore Server Running'})

@app.route('/api/profile', methods=['GET'])
@require_auth
def get_profile():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'message': '无法识别用户'}), 401

    accounts = read_json('accounts.json')
    user = next((a for a in accounts if a['id'] == user_id), None)
    if not user:
        return jsonify({'message': '用户不存在'}), 404

    # 返回信息，不返回密码
    return jsonify({
        'data': {
            'id': user['id'],
            'username': user['username'],
            'email': user.get('email', ''),
            'photo': user.get('photo', '')
        }
    })

@app.route('/api/profile', methods=['PUT'])
@require_auth
def update_profile():
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'message': '无法识别用户'}), 401

    data = request.get_json()
    accounts = read_json('accounts.json')
    user = next((a for a in accounts if a['id'] == user_id), None)
    if not user:
        return jsonify({'message': '用户不存在'}), 404

    # 修改用户名（检查唯一性）
    if 'username' in data and data['username'] != user['username']:
        if any(a['username'] == data['username'] for a in accounts if a['id'] != user_id):
            return jsonify({'message': '该用户名已被使用'}), 400
        user['username'] = data['username']

    # 修改邮箱
    if 'email' in data:
        user['email'] = data['email']

    # 修改密码（需提供 currentPassword 和 newPassword）
    if 'newPassword' in data and data['newPassword']:
        current_password = data.get('currentPassword', '')
        if hash_password(current_password) != user['password']:
            return jsonify({'message': '当前密码不正确'}), 400
        user['password'] = hash_password(data['newPassword'])

    write_json('accounts.json', accounts)

    return jsonify({
        'message': '个人信息更新成功',
        'data': {
            'id': user['id'],
            'username': user['username'],
            'email': user.get('email', '')
        }
    })

# --- 照片上传配置 ---
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5MB
UPLOADS_BASE = os.path.join(os.path.dirname(__file__), 'uploads')
USER_UPLOADS_DIR = os.path.join(UPLOADS_BASE, 'users')
WORKER_UPLOADS_DIR = os.path.join(UPLOADS_BASE, 'workers')
ACCOUNT_UPLOADS_DIR = os.path.join(UPLOADS_BASE, 'accounts')
ACTIVITY_UPLOADS_DIR = os.path.join(UPLOADS_BASE, 'activities')
os.makedirs(USER_UPLOADS_DIR, exist_ok=True)
os.makedirs(WORKER_UPLOADS_DIR, exist_ok=True)
os.makedirs(ACCOUNT_UPLOADS_DIR, exist_ok=True)
os.makedirs(ACTIVITY_UPLOADS_DIR, exist_ok=True)

def allowed_photo(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/users/<user_id>/photo', methods=['POST'])
@require_auth
def upload_user_photo(user_id):
    if 'photo' not in request.files:
        return jsonify({'message': '未找到照片文件'}), 400
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'message': '未选择文件'}), 400
    if not allowed_photo(file.filename):
        return jsonify({'message': '不支持的文件类型，仅允许 jpg/jpeg/png/webp'}), 400
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_PHOTO_SIZE:
        return jsonify({'message': '文件过大，不能超过 5MB'}), 400
    users = read_json('users.json')
    user = next((u for u in users if u['id'] == user_id), None)
    if not user:
        return jsonify({'message': '用户不存在'}), 404
    # 删除旧照片
    old_photo = user.get('photo')
    if old_photo:
        old_path = os.path.join(USER_UPLOADS_DIR, old_photo)
        if os.path.exists(old_path):
            os.remove(old_path)
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = secure_filename(f"{user_id}_avatar.{ext}")
    file.save(os.path.join(USER_UPLOADS_DIR, filename))
    user['photo'] = filename
    write_json('users.json', users)
    return jsonify({'message': '照片上传成功', 'data': {'photo': filename}})

@app.route('/api/workers/<worker_id>/photo', methods=['POST'])
@require_auth
def upload_worker_photo(worker_id):
    if 'photo' not in request.files:
        return jsonify({'message': '未找到照片文件'}), 400
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'message': '未选择文件'}), 400
    if not allowed_photo(file.filename):
        return jsonify({'message': '不支持的文件类型，仅允许 jpg/jpeg/png/webp'}), 400
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_PHOTO_SIZE:
        return jsonify({'message': '文件过大，不能超过 5MB'}), 400
    workers = read_json('workers.json')
    worker = next((w for w in workers if w['id'] == worker_id), None)
    if not worker:
        return jsonify({'message': '护工不存在'}), 404
    # 删除旧照片
    old_photo = worker.get('photo')
    if old_photo:
        old_path = os.path.join(WORKER_UPLOADS_DIR, old_photo)
        if os.path.exists(old_path):
            os.remove(old_path)
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = secure_filename(f"{worker_id}_avatar.{ext}")
    file.save(os.path.join(WORKER_UPLOADS_DIR, filename))
    worker['photo'] = filename
    write_json('workers.json', workers)
    return jsonify({'message': '照片上传成功', 'data': {'photo': filename}})

@app.route('/api/accounts/<account_id>/photo', methods=['POST'])
@require_auth
def upload_account_photo(account_id):
    if 'photo' not in request.files:
        return jsonify({'message': '未找到照片文件'}), 400
    file = request.files['photo']
    if file.filename == '':
        return jsonify({'message': '未选择文件'}), 400
    if not allowed_photo(file.filename):
        return jsonify({'message': '不支持的文件类型，仅允许 jpg/jpeg/png/webp'}), 400
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)
    if file_size > MAX_PHOTO_SIZE:
        return jsonify({'message': '文件过大，不能超过 5MB'}), 400
    accounts = read_json('accounts.json')
    account = next((a for a in accounts if a['id'] == account_id), None)
    if not account:
        return jsonify({'message': '账号不存在'}), 404
    # 删除旧头像
    old_photo = account.get('photo')
    if old_photo:
        old_path = os.path.join(ACCOUNT_UPLOADS_DIR, old_photo)
        if os.path.exists(old_path):
            os.remove(old_path)
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = secure_filename(f"{account_id}_avatar.{ext}")
    file.save(os.path.join(ACCOUNT_UPLOADS_DIR, filename))
    account['photo'] = filename
    write_json('accounts.json', accounts)
    return jsonify({'message': '头像上传成功', 'photo': filename})

@app.route('/api/uploads/accounts/<filename>')
def get_account_photo(filename):
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'accounts')
    return send_from_directory(uploads_dir, filename)

@app.route('/api/uploads/users/<filename>')
def get_user_photo(filename):
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'users')
    return send_from_directory(uploads_dir, filename)

@app.route('/api/uploads/workers/<filename>')
def get_worker_photo(filename):
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'workers')
    return send_from_directory(uploads_dir, filename)

@app.route('/api/activities/<activity_id>/photos', methods=['POST'])
@require_auth
def upload_activity_photos(activity_id):
    activities = read_json('activities.json')
    activity = next((a for a in activities if a['id'] == activity_id), None)
    if not activity:
        return jsonify({'message': '活动不存在'}), 404

    if 'photos' not in request.files:
        return jsonify({'message': '未找到照片文件'}), 400

    files = request.files.getlist('photos')
    if not files or all(f.filename == '' for f in files):
        return jsonify({'message': '未选择文件'}), 400

    existing_photos = activity.get('photos', [])
    start_index = len(existing_photos) + 1
    new_photos = []

    for i, file in enumerate(files):
        if file.filename == '':
            continue
        if not allowed_photo(file.filename):
            return jsonify({'message': '不支持的文件类型，仅允许 jpg/jpeg/png/webp'}), 400
        file.seek(0, 2)
        file_size = file.tell()
        file.seek(0)
        if file_size > MAX_PHOTO_SIZE:
            return jsonify({'message': '文件过大，不能超过 5MB'}), 400

        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = secure_filename(f"{activity_id}_{start_index + i}.{ext}")
        file.save(os.path.join(ACTIVITY_UPLOADS_DIR, filename))
        new_photos.append(filename)

    activity['photos'] = existing_photos + new_photos
    write_json('activities.json', activities)
    return jsonify({'message': '上传成功', 'photos': activity['photos']})

@app.route('/api/activities/<activity_id>/photos/<filename>', methods=['DELETE'])
@require_auth
def delete_activity_photo(activity_id, filename):
    activities = read_json('activities.json')
    activity = next((a for a in activities if a['id'] == activity_id), None)
    if not activity:
        return jsonify({'message': '活动不存在'}), 404

    photos = activity.get('photos', [])
    if filename not in photos:
        return jsonify({'message': '照片不存在'}), 404

    photos.remove(filename)
    activity['photos'] = photos

    photo_path = os.path.join(ACTIVITY_UPLOADS_DIR, filename)
    try:
        if os.path.exists(photo_path):
            os.remove(photo_path)
    except Exception:
        pass

    write_json('activities.json', activities)
    return jsonify({'message': '删除成功', 'photos': activity['photos']})

@app.route('/api/uploads/activities/<filename>')
def get_activity_photo(filename):
    uploads_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'activities')
    return send_from_directory(uploads_dir, filename)

if __name__ == '__main__':
    print("[*] Starting Smart Nursing Home Backend...")
    print("[*] Accounts Database: " + ACCOUNTS_FILE)
    print("[*] Server running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)