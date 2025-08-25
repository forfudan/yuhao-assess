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
          </div>
          <div class="header-actions">
            <button @click="toggleAllCards" class="action-button" :title="allCardsCollapsed ? '展開所有卡片' : '摺疊所有卡片'">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path v-if="allCardsCollapsed" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                <path v-else d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
            </button>
            <button @click="toggleCardDirectory" class="action-button" title="快速導航">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2Z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 悬浮导航菜单 -->
    <Transition name="dropdown">
      <div v-if="showCardDirectory" class="floating-navigation">
        <div class="nav-dropdown">
          <div class="nav-header">
            <span class="nav-header-title">快速導航</span>
          </div>
          <div class="nav-menu">
            <a @click="scrollToCard('uploader')" class="nav-item">
              <span class="nav-icon">📤</span>
              <span class="nav-title">碼表上傳</span>
            </a>
            <a v-if="analysisReady" @click="scrollToCard('duplicate')" class="nav-item">
              <span class="nav-icon">🔢</span>
              <span class="nav-title">重碼數據分析</span>
            </a>
            <a v-if="analysisReady" @click="scrollToCard('maximum')" class="nav-item">
              <span class="nav-icon">📊</span>
              <span class="nav-title">最大候選項個數</span>
            </a>
            <a v-if="analysisReady" @click="scrollToCard('speed')" class="nav-item">
              <span class="nav-icon">⚡</span>
              <span class="nav-title">全碼速度當量分析</span>
            </a>
            <a v-if="analysisReady" @click="scrollToCard('comparison')" class="nav-item">
              <span class="nav-icon">🆚</span>
              <span class="nav-title">方案對比</span>
            </a>
            <a v-if="analysisReady" @click="scrollToCard('heatmap')" class="nav-item">
              <span class="nav-icon">⌨️</span>
              <span class="nav-title">鍵位熱力圖</span>
            </a>
            <a v-if="analysisReady" @click="scrollToCard('analysis')" class="nav-item">
              <span class="nav-icon">📋</span>
              <span class="nav-title">碼表分析</span>
            </a>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 遮罩层 -->
    <Transition name="fade">
      <div v-if="showCardDirectory" class="nav-overlay" @click="toggleCardDirectory"></div>
    </Transition>

    <!-- 主要內容區域 - 設計為單列模塊布局 -->
    <main class="main">
      <div class="container">
        <!-- 
         卡片容器 
         所有的卡片使用統一的樣式：
         - 統一的標題底色樣式（漸變色），但各個卡片的漸變色可不同。
         - 統一的卡片標題及標題下方信息行的字體和大小。
         - 統一的卡片樣式（圓角大小、背景色、陰影效果等）。
        -->
        <div class="cards-container">
          <!-- 碼表上傳卡片 -->
          <CodeTableUploaderCard 
            id="card-uploader"
            ref="uploaderCardRef"
            @upload-success="handleCodeTableUpload"
            @upload-error="handleUploadError"
            :upload-status="uploadStatus"
          />

          <!-- 重碼數據分析卡片 -->
          <DuplicateAnalysisCard 
            v-if="analysisReady" 
            id="card-duplicate"
            ref="duplicateAnalysisCardRef"
            :code-table="codeTable" 
          />

          <!-- 最大候選個數卡片 -->
          <MaximumCandidatesCard 
            v-if="analysisReady" 
            id="card-maximum"
            ref="maximumCandidatesCardRef"
            :code-table="codeTable" 
          />

          <!-- 速度當量卡片 -->
          <SpeedEquivCard 
            v-if="analysisReady" 
            id="card-speed"
            ref="speedEquivCardRef"
            :code-table="codeTable" 
            :code-table-name="codeTableName" 
            :initial-prefix="uploadPrefixFlag" 
          />

          <!-- 方案對比卡片 -->
          <ComparisonCard 
            v-if="analysisReady" 
            id="card-comparison"
            ref="comparisonCardRef"
            :currentCodeTable="codeTable" 
            :currentCodeTableName="codeTableName" 
          />

          <!-- 鍵位熱力圖卡片 -->
          <KeyboardHeatmapCard 
            v-if="analysisReady" 
            id="card-heatmap"
            ref="keyboardHeatmapCardRef"
            :code-table="codeTable" 
            :analysis-ready="analysisReady" 
          />

          <!-- 碼表分析卡片 -->
          <CodeTableAnalysisCard 
            v-if="analysisReady" 
            id="card-analysis"
            ref="codeTableAnalysisCardRef"
            :analysis="analysisData" 
          />
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
import CodeTableUploaderCard from './components/CodeTableUploaderCard.vue'
import KeyboardHeatmapCard from './components/KeyboardHeatmapCard.vue'
import CodeTableAnalysisCard from './components/CodeTableAnalysisCard.vue'
import DuplicateAnalysisCard from './components/DuplicateAnalysisCard.vue'
import MaximumCandidatesCard from './components/MaximumCandidatesCard.vue'
import ComparisonCard from './components/ComparisonCard.vue'
import SpeedEquivCard from './components/SpeedEquivCard.vue'
import type { CodeTable, UploadStatus, CodeTableAnalysis } from './types/index'

// 響應式數據
const codeTable = ref<CodeTable>(new Map())
const codeTableName = ref<string>('')
const analysisReady = ref(false)
const uploadStatus = ref<UploadStatus | null>(null)
const analysisData = ref<CodeTableAnalysis | null>(null)
const analysisResults = ref(null)
const uploadPrefixFlag = ref<boolean>(false)

// 上传卡片引用
const uploaderCardRef = ref()
const duplicateAnalysisCardRef = ref()
const maximumCandidatesCardRef = ref()
const speedEquivCardRef = ref()
const comparisonCardRef = ref()
const keyboardHeatmapCardRef = ref()
const codeTableAnalysisCardRef = ref()

// 卡片目录和折叠状态
const showCardDirectory = ref(false)
const allCardsCollapsed = ref(false)

// 切换卡片目录显示
const toggleCardDirectory = () => {
  showCardDirectory.value = !showCardDirectory.value
}

// 滚动到指定卡片
const scrollToCard = (cardId: string) => {
  const element = document.getElementById(`card-${cardId}`)
  if (element) {
    // 先关闭导航菜单
    showCardDirectory.value = false
    
    // 延迟滚动，让菜单先关闭
    setTimeout(() => {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      })
      
      // 滚动完成后，检查并展开卡片（如果是收起状态）
      setTimeout(() => {
        expandCardIfCollapsed(cardId)
      }, 800) // 等待滚动动画完成
    }, 150)
  }
}

// 如果卡片是收起状态，则展开它
const expandCardIfCollapsed = (cardId: string) => {
  const cardRefMap: Record<string, any> = {
    'uploader': uploaderCardRef.value,
    'duplicate': duplicateAnalysisCardRef.value,
    'maximum': maximumCandidatesCardRef.value,
    'speed': speedEquivCardRef.value,
    'comparison': comparisonCardRef.value,
    'heatmap': keyboardHeatmapCardRef.value,
    'analysis': codeTableAnalysisCardRef.value
  }
  
  const cardRef = cardRefMap[cardId]
  if (cardRef && typeof cardRef.getCollapsedState === 'function' && typeof cardRef.expand === 'function') {
    // 检查卡片是否是收起状态
    const isCollapsed = cardRef.getCollapsedState()
    if (isCollapsed) {
      cardRef.expand()
    }
  }
}

// 切换所有卡片的折叠状态
const toggleAllCards = () => {
  allCardsCollapsed.value = !allCardsCollapsed.value
  
  // 获取所有卡片的引用
  const cardRefs = [
    uploaderCardRef.value,
    duplicateAnalysisCardRef.value,
    maximumCandidatesCardRef.value,
    speedEquivCardRef.value,
    comparisonCardRef.value,
    keyboardHeatmapCardRef.value,
    codeTableAnalysisCardRef.value
  ]
  
  // 根据状态折叠或展开所有卡片
  cardRefs.forEach(cardRef => {
    if (cardRef) {
      if (allCardsCollapsed.value) {
        if (typeof cardRef.collapse === 'function') {
          cardRef.collapse()
        }
      } else {
        if (typeof cardRef.expand === 'function') {
          cardRef.expand()
        }
      }
    }
  })
}

// 主題相關
const isDarkMode = ref(false)

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
const handleCodeTableUpload = (data: { codeTable: CodeTable; fileName: string; format: string; tableKey?: string; isPrefix?: boolean }) => {
  codeTable.value = data.codeTable
  codeTableName.value = data.tableKey || data.fileName.replace(/\.(txt|csv)$/, '') // 优先使用tableKey，用于内置方案前缀码检测
  uploadPrefixFlag.value = data.isPrefix || false  // 设置用户上传时的前缀码标记
  analysisReady.value = true
  
  // 生成分析數據
  analysisData.value = generateAnalysis(data.codeTable)
  
  // 保存到本地存儲
  saveCodeTableData()
  
  // 码表分析成功后，自动折叠上传卡片
  if (uploaderCardRef.value && typeof uploaderCardRef.value.collapse === 'function') {
    setTimeout(() => {
      uploaderCardRef.value.collapse()
    }, 500) // 延迟500ms，让用户看到成功反馈
  }
  
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
  margin: 0; /* 移除下边距，因为删除了副标题 */
}

/* 头部操作按钮 */
.header-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.action-button {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  padding: 8px;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
  transform: scale(1.05);
}

/* 悬浮导航菜单样式 */
.floating-navigation {
  position: fixed;
  top: 80px; /* 从header下方开始 */
  right: 20px; /* 对齐右侧按钮 */
  z-index: 1000;
  transform-origin: top right;
}

.nav-dropdown {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-width: 280px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.nav-header {
  padding: var(--spacing-md) var(--spacing-lg);
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.nav-menu {
  padding: var(--spacing-sm) 0;
  max-height: 400px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  color: var(--color-text-primary);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(59, 130, 246, 0.06);
  color: var(--color-primary);
  padding-left: calc(var(--spacing-lg) + 4px);
}

.nav-icon {
  font-size: 1.1rem;
  margin-right: var(--spacing-md);
  min-width: 20px;
  text-align: center;
}

.nav-title {
  font-size: 0.9rem;
  font-weight: 500;
}

/* 遮罩层样式 */
.nav-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 999;
  backdrop-filter: blur(2px);
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* 遮罩层淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 主要内容区域 - 卡片布局 */
.main {
  padding: var(--spacing-2xl) 0;
  min-height: calc(100vh - 200px);
}

/* 卡片容器 - 单列布局 */
.cards-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  width: 100%;
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
  .header-actions {
    gap: var(--spacing-sm);
  }
  
  .action-button {
    padding: 6px;
  }
  
  .directory-header {
    padding: var(--spacing-md) var(--spacing-lg);
  }
  
  .directory-list {
    padding: var(--spacing-md);
  }
  
  .floating-navigation {
    right: 10px;
    left: 10px;
    top: 70px;
  }
  
  .nav-dropdown {
    min-width: auto;
    width: 100%;
  }
  
  .nav-item {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .nav-title {
    font-size: 0.85rem;
  }
  
  .main {
    padding: var(--spacing-lg) 0;
  }
  
  .container {
    max-width: 100%;
    padding: 0 var(--spacing-md);
  }
  
  .cards-container {
    gap: var(--spacing-lg);
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
</style>

<!-- 全局卡片样式 -->
<style>
/* 各个卡片组件的外层容器样式 */
.duplicate-analysis-card,
.maximum-candidates-card,
.speed-equiv-card,
.comparison-card,
.code-table-uploader,
.keyboard-heatmap,
.code-table-viewer {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  width: 100%;
  overflow: hidden;
  border-radius: 12px; /* 确保外层容器有圆角 */
}

.duplicate-analysis-card:hover,
.maximum-candidates-card:hover,
.speed-equiv-card:hover,
.comparison-card:hover,
.code-table-uploader:hover,
.keyboard-heatmap:hover,
.code-table-viewer:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* 卡片头部 - 统一渐变背景 */
.card-header {
  padding: var(--spacing-lg) var(--spacing-xl);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  margin: 0;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.card-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.duplicate-analysis-card:hover .card-header::before,
.maximum-candidates-card:hover .card-header::before,
.speed-equiv-card:hover .card-header::before,
.comparison-card:hover .card-header::before,
.code-table-uploader:hover .card-header::before,
.keyboard-heatmap:hover .card-header::before,
.code-table-viewer:hover .card-header::before {
  opacity: 1;
}

/* 卡片标题 - 统一字体样式 */
.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  margin-bottom: var(--spacing-xs);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 卡片描述 - 统一字体样式 */
.card-description {
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

/* 卡片内容 */
.card-content {
  padding: var(--spacing-xl);
  background-color: var(--color-bg-secondary);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

/* 不同卡片的渐变色主题 - 更优雅的配色 */
.upload-card .card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.duplicate-analysis-card .card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.maximum-candidates-card .card-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.speed-equiv-card .card-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.comparison-card .card-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.keyboard-heatmap .card-header {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}

.code-table-viewer .card-header {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    padding: var(--spacing-lg);
  }
  
  .card-content {
    padding: var(--spacing-lg);
  }
  
  .card-title {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .card-header {
    padding: var(--spacing-md);
  }
  
  .card-content {
    padding: var(--spacing-md);
  }
  
  .card-title {
    font-size: 1.1rem;
  }
}
</style>
