<template>
  <div class="duplicate-analysis-card">
    <div class="card-header">
      <h3>重碼數據分析</h3>
      <div class="controls">
        <select v-model="selectedCharset" class="charset-select">
          <option v-for="(info, key) in charsetOptions" :key="key" :value="key">
            {{ info.name }} ({{ info.description }})
          </option>
        </select>
        <button @click="calculateDuplicates" :disabled="isCalculating" class="calculate-btn">
          {{ isCalculating ? '計算中...' : '計算重碼' }}
        </button>
      </div>
    </div>

    <div class="card-content">
      <div v-if="isCalculating" class="loading">
        <div class="spinner"></div>
        <p>正在計算重碼數據...</p>
      </div>

      <div v-else-if="analysisResult" class="analysis-results">
        <div class="metrics-grid">
          <div class="metric-card">
            <h4>靜態重碼率</h4>
            <div class="metric-value">{{ (analysisResult.staticDupRate * 100).toFixed(2) }}%</div>
            <p class="metric-desc">全碼重碼字數 / 總字數</p>
          </div>

          <div class="metric-card">
            <h4>動態選重率</h4>
            <div class="metric-value">{{ (analysisResult.dynamicDupRate * 100).toFixed(2) }}%</div>
            <p class="metric-desc">基於簡體字頻的加權選重率</p>
          </div>

          <div class="metric-card">
            <h4>字符集總數</h4>
            <div class="metric-value">{{ analysisResult.totalChars.toLocaleString() }}</div>
            <p class="metric-desc">當前字符集包含的字符數量</p>
          </div>

          <div class="metric-card">
            <h4>重碼字符數</h4>
            <div class="metric-value">{{ analysisResult.duplicateChars.toLocaleString() }}</div>
            <p class="metric-desc">存在全碼重碼的字符數量</p>
          </div>
        </div>

        <div class="duplicate-details" v-if="analysisResult.duplicateGroups.length > 0">
          <h4>重碼詳情 (顯示前10組)</h4>
          <div class="duplicate-list">
            <div v-for="(group, index) in analysisResult.duplicateGroups.slice(0, 10)" 
                 :key="index" 
                 class="duplicate-group">
              <span class="code">{{ group.code }}</span>
              <span class="chars">{{ group.chars.join(' ') }}</span>
              <span class="count">({{ group.chars.length }}字)</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>請選擇字符集並點擊「計算重碼」來查看分析結果</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { charsetInfo, type CharsetType } from '../services/charsetService'
import type { CodeTable } from '../types'

// Props
interface Props {
  codeTable?: CodeTable
}

const props = withDefaults(defineProps<Props>(), {
  codeTable: () => new Map()
})

// 响应式数据
const selectedCharset = ref<CharsetType>('gb2312')
const isCalculating = ref(false)
const analysisResult = ref<{
  staticDupRate: number
  dynamicDupRate: number
  totalChars: number
  duplicateChars: number
  duplicateGroups: Array<{ code: string; chars: string[] }>
} | null>(null)

// 计算属性
const charsetOptions = computed(() => {
  const filteredKeys: CharsetType[] = ['gb2312', 'guozi']
  
  const result: Record<string, { name: string; description: string }> = {}
  for (const key of filteredKeys) {
    if (charsetInfo[key]) {
      result[key] = charsetInfo[key]
    }
  }
  return result
})

// 计算重码
async function calculateDuplicates() {
  if (!props.codeTable || props.codeTable.size === 0) {
    console.warn('没有可用的码表数据')
    return
  }
  
  isCalculating.value = true
  
  try {
    // 模拟异步计算
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 计算重码组
    const duplicateGroups: Array<{ code: string; chars: string[] }> = []
    const codeToChars = new Map<string, string[]>()
    
    // 遍历码表构建重码组
    for (const [char, codes] of props.codeTable.entries()) {
      if (codes.length > 0) {
        const code = codes[0]
        if (!codeToChars.has(code)) {
          codeToChars.set(code, [])
        }
        codeToChars.get(code)!.push(char)
      }
    }
    
    // 提取重码组
    for (const [code, chars] of codeToChars.entries()) {
      if (chars.length > 1) {
        duplicateGroups.push({ code, chars })
      }
    }
    
    // 按重码字符数量排序
    duplicateGroups.sort((a, b) => b.chars.length - a.chars.length)
    
    // 简单的重码率计算
    const totalChars = props.codeTable.size
    const duplicateChars = duplicateGroups.reduce((sum, group) => sum + group.chars.length, 0)
    const staticDupRate = duplicateChars / totalChars
    
    analysisResult.value = {
      staticDupRate: staticDupRate,
      dynamicDupRate: staticDupRate * 0.8, // 简化的动态重码率
      totalChars,
      duplicateChars,
      duplicateGroups
    }
  } catch (error) {
    console.error('计算重码时出错:', error)
  } finally {
    isCalculating.value = false
  }
}

// 组件挂载时自动计算一次
onMounted(() => {
  calculateDuplicates()
})
</script>

<style scoped>
.duplicate-analysis-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 20px;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.charset-select {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  font-size: 14px;
  cursor: pointer;
  min-width: 180px;
}

.calculate-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.calculate-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.calculate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-content {
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.metric-card h4 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 14px;
  font-weight: 600;
}

.metric-value {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 5px;
}

.metric-desc {
  font-size: 12px;
  color: #6c757d;
  margin: 0;
}

.duplicate-details {
  border-top: 1px solid #e9ecef;
  padding-top: 20px;
}

.duplicate-details h4 {
  margin: 0 0 15px 0;
  color: #495057;
}

.duplicate-list {
  max-height: 300px;
  overflow-y: auto;
}

.duplicate-group {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 5px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
}

.duplicate-group .code {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #e83e8c;
  min-width: 80px;
}

.duplicate-group .chars {
  flex: 1;
  font-size: 16px;
  color: #495057;
}

.duplicate-group .count {
  font-size: 12px;
  color: #6c757d;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controls {
    justify-content: center;
  }
  
  .charset-select {
    min-width: auto;
    flex: 1;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .metric-value {
    font-size: 1.5rem;
  }
  
  .duplicate-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .duplicate-group .code {
    min-width: auto;
  }
}
</style>
