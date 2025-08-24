<template>
  <div id="app">
    <!-- 主題切換按鈕 -->
    <!-- 暫時性地注释掉主题切换功能，等到暗黑主題后续完善後再啟用
    <button 
      class="theme-toggle" 
      @click="toggleTheme"
      :title="isDarkMode ? '切換到淺色模式' : '切換到深色模式'"
    >
      {{ isDarkMode ? '☀️' : '🌙' }}
    </button>
     -->

    <!-- 頭部導航 -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <h1>宇浩測評網</h1>
            <span class="subtitle">輸入法性能測評工具</span>
          </div>
          <nav class="nav">
            <a href="https://shurufa.app" target="_blank" class="nav-link">
              宇浩輸入法
            </a>
            <a href="https://github.com/forfudan/yu" target="_blank" class="nav-link">
              GitHub
            </a>
            <!-- 全局折叠控制按钮 -->
            <button 
              class="global-toggle-btn-header"
              @click="toggleAllModules"
              :title="allModulesCollapsed ? '展開全部' : '折疊全部'"
            >
              <span class="btn-icon">{{ allModulesCollapsed ? '📂' : '📁' }}</span>
              <span class="btn-text">{{ allModulesCollapsed ? '展開全部' : '折疊全部' }}</span>
            </button>
          </nav>
        </div>
      </div>
    </header>

    <!-- 主要內容區域 - 設計為單列模塊布局 -->
    <main class="main">
      <div class="container">
        <!-- 模块容器 -->
        <div class="module-container">
          <!-- 碼表上傳模塊 -->
          <div class="module-card">
            <div class="module-header">
              <h3 class="module-title">碼表上傳</h3>
              <button 
                class="toggle-button"
                @click="toggleModule('upload')"
                :title="modules.upload.collapsed ? '展開' : '收起'"
              >
                <span class="toggle-icon" :class="{ 'collapsed': modules.upload.collapsed }">
                  ▼
                </span>
              </button>
            </div>
            <div v-show="!modules.upload.collapsed" class="module-content">
              <p class="module-description">
                上傳您的輸入法碼表文件進行性能分析。支持"字符-編碼"和"編碼-字符"兩種格式。
              </p>
              
              <CodeTableUploader 
                @upload-success="handleCodeTableUpload"
                @upload-error="handleUploadError"
              />
              
              <!-- 上傳狀態顯示 -->
              <div v-if="uploadStatus" class="upload-status" :class="uploadStatus.type">
                <span class="status-icon">
                  {{ uploadStatus.type === 'success' ? '✓' : '✗' }}
                </span>
                {{ uploadStatus.message }}
              </div>
            </div>
          </div>


          <!-- 重碼信息模塊 -->
          <div v-if="analysisReady" class="module-card">
            <div class="module-header">
              <h3 class="module-title">重碼信息</h3>
              <button 
                class="toggle-button"
                @click="toggleModule('duplicate')"
                :title="modules.duplicate.collapsed ? '展開' : '收起'"
              >
                <span class="toggle-icon" :class="{ 'collapsed': modules.duplicate.collapsed }">
                  ▼
                </span>
              </button>
            </div>
            <!--重碼數據分析卡片-->
            <div v-show="!modules.duplicate.collapsed" class="module-content">
              <DuplicateAnalysisCard :code-table="codeTable" />
            </div>
            <!--最大候選個數卡片-->
            <div v-show="!modules.duplicate.collapsed" class="module-content">
              <MaximumCandidatesCard :code-table="codeTable" />
            </div>
          </div>

          <!-- 方案對比模塊 -->
          <div v-if="analysisReady" class="module-card">
            <div class="module-header">
              <h3 class="module-title">方案對比</h3>
              <button 
                class="toggle-button"
                @click="toggleModule('duplicate')"
                :title="modules.duplicate.collapsed ? '展開' : '收起'"
              >
                <span class="toggle-icon" :class="{ 'collapsed': modules.duplicate.collapsed }">
                  ▼
                </span>
              </button>
            </div>
            <div v-show="!modules.duplicate.collapsed" class="module-content">
              <p class="module-description">
                對比不同輸入法方案的重碼數據，支持內置方案和文件上傳。
              </p>
              <ComparisonCard :currentCodeTable="codeTable" :currentCodeTableName="codeTableName" />
            </div>
          </div>

          <!-- 鍵位熱力圖模塊 -->
          <div v-if="analysisReady" class="module-card">
            <div class="module-header">
              <h3 class="module-title">鍵位熱力圖</h3>
              <button 
                class="toggle-button"
                @click="toggleModule('heatmap')"
                :title="modules.heatmap.collapsed ? '展開' : '收起'"
              >
                <span class="toggle-icon" :class="{ 'collapsed': modules.heatmap.collapsed }">
                  ▼
                </span>
              </button>
            </div>
            <div v-show="!modules.heatmap.collapsed" class="module-content">
              <p class="module-description">
                分析碼表的鍵位分布和使用頻率，可視化展示鍵位負擔。
              </p>
              
              <KeyboardHeatmap 
                :code-table="codeTable"
                :analysis-ready="analysisReady"
              />
            </div>
          </div>

          <!-- 碼表分析模塊 -->
          <div v-if="analysisReady" class="module-card">
            <div class="module-header">
              <h3 class="module-title">碼表分析</h3>
              <button 
                class="toggle-button"
                @click="toggleModule('analysis')"
                :title="modules.analysis.collapsed ? '展開' : '收起'"
              >
                <span class="toggle-icon" :class="{ 'collapsed': modules.analysis.collapsed }">
                  ▼
                </span>
              </button>
            </div>
            <div v-show="!modules.analysis.collapsed" class="module-content">
              <p class="module-description">
                詳細分析碼表的基本信息。
              </p>
              
              <CodeTableViewer 
                :analysis="analysisData"
              />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 頁腳 -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <p>&copy; 2025 宇浩測評網. 基于 Vue 3 + TypeScript 構建</p>
          <p class="footer-links">
            <a href="https://shurufa.app" target="_blank">宇浩輸入法官網</a>
            <span>·</span>
            <a href="https://zhuyuhao.com" target="_blank">作者主頁</a>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import CodeTableUploader from './components/CodeTableUploader.vue'
import KeyboardHeatmap from './components/KeyboardHeatmap.vue'
import CodeTableViewer from './components/CodeTableViewer.vue'
import DuplicateAnalysisCard from './components/DuplicateAnalysisCard.vue'
import MaximumCandidatesCard from './components/MaximumCandidatesCard.vue'
import ComparisonCard from './components/ComparisonCard.vue'
import type { CodeTable, UploadStatus, CodeTableAnalysis } from './types/index'

// 響應式數據
const codeTable = ref<CodeTable>(new Map())
const codeTableName = ref<string>('')
const analysisReady = ref(false)
const uploadStatus = ref<UploadStatus | null>(null)
const analysisData = ref<CodeTableAnalysis | null>(null)
const analysisResults = ref(null)

// 主題相關
const isDarkMode = ref(false)

// 模块折叠状态管理
const modules = ref({
  upload: { collapsed: false },
  heatmap: { collapsed: false },
  analysis: { collapsed: false },
  duplicate: { collapsed: false },
  comparison: { collapsed: false }
})

// 切换模块折叠状态
const toggleModule = (moduleKey: keyof typeof modules.value) => {
  modules.value[moduleKey].collapsed = !modules.value[moduleKey].collapsed
}

// 计算是否所有模块都已折叠
const allModulesCollapsed = computed(() => {
  return Object.values(modules.value).every(module => module.collapsed)
})

// 全部展开/折叠
const toggleAllModules = () => {
  const targetState = !allModulesCollapsed.value
  Object.keys(modules.value).forEach(key => {
    modules.value[key as keyof typeof modules.value].collapsed = targetState
  })
}

// 初始化主題和數據恢復
onMounted(() => {
  // 初始化主題，默認淺色模式
  const savedTheme = localStorage.getItem('theme')
  isDarkMode.value = savedTheme === 'dark'
  updateTheme()
  
  // 恢復碼表數據
  restoreCodeTableData()
})

// 切換主題
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  updateTheme()
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
}

// 更新主題
const updateTheme = () => {
  document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light')
}

// 保存碼表數據到本地存儲
const saveCodeTableData = () => {
  if (analysisReady.value && codeTable.value.size > 0) {
    const data = {
      codeTable: Array.from(codeTable.value.entries()),
      analysisData: analysisData.value,
      timestamp: Date.now()
    }
    localStorage.setItem('savedCodeTable', JSON.stringify(data))
  }
}

// 恢復碼表數據
const restoreCodeTableData = () => {
  try {
    const saved = localStorage.getItem('savedCodeTable')
    if (saved) {
      const data = JSON.parse(saved)
      
      // 檢查數據是否過於陳舊（超過24小時則清除）
      const oneDayMs = 24 * 60 * 60 * 1000
      if (Date.now() - data.timestamp > oneDayMs) {
        localStorage.removeItem('savedCodeTable')
        return
      }
      
      // 恢復碼表數據
      codeTable.value = new Map(data.codeTable)
      analysisData.value = data.analysisData
      analysisReady.value = true
      
      // 自動隱藏上傳模塊
      modules.value.upload.collapsed = true
    }
  } catch (error) {
    console.error('恢復碼表數據失敗:', error)
    localStorage.removeItem('savedCodeTable')
  }
}

// 生成分析數據
function generateAnalysis(codeTable: CodeTable): CodeTableAnalysis {
  const totalChars = codeTable.size
  let totalCodes = 0
  const codeLengthDistribution: { [key: number]: number } = {}
  let regularChars = 0
  let gbkChars = 0
  const cjkChars = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0, I: 0 }
  const topEntries: Array<{ char: string; codes: string[] }> = []
  
  // 分析字符和編碼
  const entries = Array.from(codeTable.entries()).map(([char, codes]) => {
    totalCodes += codes.length
    
    // 統計編碼長度分布
    codes.forEach(code => {
      const length = code.length
      codeLengthDistribution[length] = (codeLengthDistribution[length] || 0) + 1
    })
    
    // 判斷CJK字符類型
    const charCode = char.charCodeAt(0)
    if (charCode >= 0x4e00 && charCode <= 0x9fff) {
      cjkChars.A++  // CJK基本漢字區
      regularChars++
      gbkChars++
    } else if (charCode >= 0x3400 && charCode <= 0x4dbf) {
      cjkChars.B++  // CJK擴展A區
    } else if (charCode >= 0x20000 && charCode <= 0x2a6df) {
      cjkChars.C++  // CJK擴展B區
    } else if (charCode >= 0x2a700 && charCode <= 0x2b73f) {
      cjkChars.D++  // CJK擴展C區
    } else if (charCode >= 0x2b740 && charCode <= 0x2b81f) {
      cjkChars.E++  // CJK擴展D區
    } else if (charCode >= 0x2b820 && charCode <= 0x2ceaf) {
      cjkChars.F++  // CJK擴展E區
    } else if (charCode >= 0x2ceb0 && charCode <= 0x2ebef) {
      cjkChars.G++  // CJK擴展F區
    } else if (charCode >= 0x30000 && charCode <= 0x3134f) {
      cjkChars.H++  // CJK擴展G區
    } else if (charCode >= 0x31350 && charCode <= 0x323af) {
      cjkChars.I++  // CJK擴展H區
    } else if (charCode >= 0x2e80 && charCode <= 0x2eff) {
      // CJK部首補充 - 不計入任何區塊
    }
    
    return { char, codes }
  })
  
  // 取前5個條目
  topEntries.push(...entries.slice(0, 5))
  
  return {
    totalChars,
    totalCodes,
    regularChars,
    gbkChars,
    cjkChars,
    topEntries
  }
}

// 處理碼表上傳成功
const handleCodeTableUpload = (data: { codeTable: CodeTable; fileName: string; format: string }) => {
  codeTable.value = data.codeTable
  codeTableName.value = data.fileName.replace(/\.(txt|csv)$/, '') // 移除文件後綴
  analysisReady.value = true
  
  // 生成分析數據
  analysisData.value = generateAnalysis(data.codeTable)
  
  // 保存到本地存儲
  saveCodeTableData()
  
  // 自動隱藏碼表上傳模塊
  modules.value.upload.collapsed = true
  
  uploadStatus.value = {
    type: 'success',
    message: `碼表 "${data.fileName}" 上傳成功！共 ${data.codeTable.size} 個字符`
  }

  // 3秒後清除狀態
  setTimeout(() => {
    uploadStatus.value = null
  }, 3000)

}

// 處理上傳錯誤
const handleUploadError = (error: string) => {
  uploadStatus.value = {
    type: 'error',
    message: error
  }

  // 5秒後清除錯誤狀態
  setTimeout(() => {
    uploadStatus.value = null
  }, 5000)

  console.error('碼表上傳失敗:', error)
}
</script>

<style scoped>
/* 头部样式保持原有设计 */
.header {
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-primary);
  padding: var(--spacing-lg) 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.nav {
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
}

.nav-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease-in-out;
}

.nav-link:hover {
  color: var(--color-primary);
}

/* 头部的全局折叠按钮 */
.global-toggle-btn-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: var(--spacing-sm);
}

.global-toggle-btn-header:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
}

.global-toggle-btn-header .btn-icon {
  font-size: 0.9rem;
}

.global-toggle-btn-header .btn-text {
  font-size: 0.8rem;
}

/* 主要内容区域 - 重新设计为单列布局 */
.main {
  padding: var(--spacing-2xl) 0;
  min-height: calc(100vh - 200px);
}

/* 模块容器 - 单列布局 */
.module-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  width: 100%;
}

/* 统一的模块卡片样式 */
.module-card {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-border-primary);
  overflow: hidden;
  transition: all 0.3s ease;
  width: 100%;
}

.module-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

/* 模块头部 */
.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-xl);
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-primary);
}

.module-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

/* 折叠/展开按钮 */
.toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
}

.toggle-button:hover {
  background-color: var(--color-bg-secondary);
}

.toggle-icon {
  font-size: 1rem;
  color: var(--color-text-secondary);
  transition: transform 0.3s ease;
  transform-origin: center;
}

.toggle-icon.collapsed {
  transform: rotate(-90deg);
}

/* 模块内容 */
.module-content {
  padding: var(--spacing-lg);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.module-description {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
  line-height: 1.6;
  font-size: 0.95rem;
}

/* 上传状态样式 */
.upload-status {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
}

.upload-status.success {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.upload-status.error {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.status-icon {
  font-weight: bold;
  font-size: 1.1rem;
}

/* 页脚样式 */
.footer {
  background-color: var(--color-bg-primary);
  border-top: 1px solid var(--color-border-primary);
  padding: var(--spacing-xl) 0;
  margin-top: var(--spacing-2xl);
}

.footer-content {
  text-align: center;
  color: var(--color-text-secondary);
}

.footer-links {
  margin-top: var(--spacing-sm);
}

.footer-links a {
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: color 0.2s ease-in-out;
}

.footer-links a:hover {
  color: var(--color-primary);
}

.footer-links span {
  margin: 0 var(--spacing-sm);
}

/* 动画效果 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main {
    padding: var(--spacing-lg) 0;
  }
  
  .global-controls {
    padding: var(--spacing-lg);
    flex-direction: column;
    gap: var(--spacing-lg);
    text-align: center;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .global-toggle-btn {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .module-container {
    gap: var(--spacing-lg);
  }
  
  .module-header {
    padding: var(--spacing-lg);
  }
  
  .module-content {
    padding: var(--spacing-lg);
  }
  
  .module-title {
    font-size: 1.2rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }
  
  .logo h1 {
    font-size: 1.5rem;
  }
  
  .nav {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .global-controls {
    padding: var(--spacing-md);
  }
  
  .page-title {
    font-size: 1.3rem;
  }
  
  .btn-text {
    display: none; /* 在小屏幕上只显示图标 */
  }
  
  .module-header {
    padding: var(--spacing-md);
  }
  
  .module-content {
    padding: var(--spacing-md);
  }
  
  .module-title {
    font-size: 1.1rem;
  }
}
</style>
