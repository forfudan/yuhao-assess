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
            <a href="https://shurufa.app/" target="_blank" class="logo-link">
              <img 
                src="/logo_blue.png" 
                alt="宇浩输入法 Logo" 
                class="logo-image"
              >
              <h1>宇浩測評網</h1>
            </a>
          </div>
                    <div class="header-actions">
            <button @click="exportAllCards" class="export-btn" title="導出所有分析卡片到一張圖片">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
            </button>
            <button @click="clearAllCache" class="action-button" title="清理所有本地緩存數據">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
              </svg>
            </button>
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
              <span class="nav-title">重碼數據</span>
            </a>
            <a v-if="analysisReady" @click="scrollToCard('maximum')" class="nav-item">
              <span class="nav-icon">📊</span>
              <span class="nav-title">候選個數</span>
            </a>
            <a v-if="analysisReady" @click="scrollToCard('speed')" class="nav-item">
              <span class="nav-icon">⚡</span>
              <span class="nav-title">速度當量</span>
            </a>
            <a v-if="analysisReady" @click="scrollToCard('efficiency')" class="nav-item">
              <span class="nav-icon">📈</span>
              <span class="nav-title">簡碼效率</span>
            </a>
            <a v-if="analysisReady" @click="scrollToCard('heatmap')" class="nav-item">
              <span class="nav-icon">⌨️</span>
              <span class="nav-title">鍵位熱力</span>
            </a>
            <!-- <a v-if="analysisReady" @click="scrollToCard('analysis')" class="nav-item">
              <span class="nav-icon">📋</span>
              <span class="nav-title">碼表分析</span>
            </a> -->
            <a v-if="analysisReady" @click="scrollToCard('comparison')" class="nav-item">
              <span class="nav-icon">🆚</span>
              <span class="nav-title">方案對比</span>
            </a>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 遮罩层 -->
    <Transition name="fade">
      <div v-if="showCardDirectory" class="nav-overlay" @click="toggleCardDirectory"></div>
    </Transition>

    <!-- 主要内容區域 - 設計爲單列模塊布局 -->
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

          <!-- 重碼數據卡片 -->
          <DuplicateAnalysisCard 
            v-if="analysisReady" 
            id="card-duplicate"
            ref="duplicateAnalysisCardRef"
            :code-table="codeTable" 
            :code-table-name="codeTableName"
          />

          <!-- 最大候選個數卡片 -->
          <MaximumCandidatesCard 
            v-if="analysisReady" 
            id="card-maximum"
            ref="maximumCandidatesCardRef"
            :code-table="codeTable" 
            :code-table-name="codeTableName"
          />

          <!-- 速度當量卡片 -->
          <SpeedEquivCard 
            v-if="analysisReady" 
            id="card-speed"
            ref="speedEquivCardRef"
            :code-table="codeTable" 
            :code-table-name="codeTableName" 
            :initial-prefix="uploadPrefixFlag"
            :global-prefix-keys="uploadPrefixKeys"
          />

          <!-- 簡碼效率卡片 -->
          <ShortCodeEfficiencyCard 
            v-if="analysisReady" 
            id="card-efficiency"
            ref="shortCodeEfficiencyCardRef"
            :code-table="codeTable" 
            :analysis-ready="analysisReady"
            :global-prefix-keys="uploadPrefixKeys"
            :code-table-name="codeTableName"
          />

          <!-- 鍵位熱力圖卡片 -->
          <KeyboardHeatmapCard 
            v-if="analysisReady" 
            id="card-heatmap"
            ref="keyboardHeatmapCardRef"
            :code-table="codeTable" 
            :analysis-ready="analysisReady" 
            :code-table-name="codeTableName"
          />

          <!-- 
          碼表分析卡片
          這個卡片的作用不大，暫時先注释掉。      
          -->
          <!-- 
          <CodeTableAnalysisCard 
            v-if="analysisReady" 
            id="card-analysis"
            ref="codeTableAnalysisCardRef"
            :analysis="analysisData" 
            :code-table-name="codeTableName"
          />
          -->

          <!-- 方案對比卡片 -->
          <ComparisonCard 
            id="card-comparison"
            ref="comparisonCardRef"
            :currentCodeTable="codeTable" 
            :currentCodeTableName="codeTableName" 
            :globalPrefixKeys="uploadPrefixKeys"
          />
        </div>
      </div>
    </main>

    <!-- 頁腳 -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <p>&copy; 2025 宇浩測評網</p>
          <p class="footer-links">
            <a href="https://shurufa.app/docs/concepts.html" target="_blank">中文輸入法常用概念指南</a>
            <span>·</span>
            <a href="https://shurufa.app/docs/statistics.html" target="_blank">常見輸入法測評數據</a>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import CodeTableUploaderCard from './components/CodeTableUploaderCard.vue'
import KeyboardHeatmapCard from './components/KeyboardHeatmapCard.vue'
import CodeTableAnalysisCard from './components/CodeTableAnalysisCard.vue'
import DuplicateAnalysisCard from './components/DuplicateAnalysisCard.vue'
import MaximumCandidatesCard from './components/MaximumCandidatesCard.vue'
import ComparisonCard from './components/ComparisonCard.vue'
import SpeedEquivCard from './components/SpeedEquivCard.vue'
import ShortCodeEfficiencyCard from './components/ShortCodeEfficiencyCard.vue'
import { codeTableProcessingService } from './services/codeTableProcessingService'
import type { CodeTable, UploadStatus, CodeTableAnalysis } from './types/index'

// 響應式數據
const codeTable = ref<CodeTable>(new Map())
const codeTableName = ref<string>('')
const analysisReady = ref(false)
const uploadStatus = ref<UploadStatus | null>(null)
const analysisData = ref<CodeTableAnalysis | null>(null)
const analysisResults = ref(null)
const uploadPrefixFlag = ref<boolean>(false)
const uploadPrefixKeys = ref<string[]>([])
const globalMaxLength = ref<number>(4) // 全局最大碼長，計算一次後不再改變

// 上传卡片引用
const uploaderCardRef = ref()
const duplicateAnalysisCardRef = ref()
const maximumCandidatesCardRef = ref()
const speedEquivCardRef = ref()
const shortCodeEfficiencyCardRef = ref()
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
    shortCodeEfficiencyCardRef.value,
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
onMounted(async () => {
  // 初始化主題，默認淺色模式
  const savedTheme = localStorage.getItem('theme')
  isDarkMode.value = savedTheme === 'dark'
  updateTheme()
  
  // 恢復碼表數據
  await restoreCodeTableData()
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
      codeTableName: codeTableName.value,
      uploadPrefixFlag: uploadPrefixFlag.value,
      uploadPrefixKeys: uploadPrefixKeys.value,
      globalMaxLength: globalMaxLength.value,
      timestamp: Date.now()
    }
    localStorage.setItem('savedCodeTable', JSON.stringify(data))
  }
}

// 恢復碼表數據
const restoreCodeTableData = async () => {
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
      codeTableName.value = data.codeTableName || ''
      uploadPrefixFlag.value = data.uploadPrefixFlag || false
      uploadPrefixKeys.value = data.uploadPrefixKeys || []
      globalMaxLength.value = data.globalMaxLength || 4
      
      // 重新處理碼表以確保processing service有正確的數據（包含字頻優化）
      await codeTableProcessingService.processCodeTable(codeTable.value, {
        isPrefix: uploadPrefixFlag.value,
        maxLength: globalMaxLength.value
      })
      
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

// 計算最大碼長的測試字符
const TEST_CHARS = ['灌', '瓣', '璧', '豁', '糯', '籍', '矗', '瓤', '嚼', '瞻', '覆', '馨', '徽', '警', '繁', '霜', '霞']

// 計算最大碼長
function calculateMaxCodeLength(codeTable: CodeTable): number {
  let maxLength = 0
  
  // 首先尝试使用测试字符
  for (const char of TEST_CHARS) {
    const codes = codeTable.get(char)
    if (codes && codes.length > 0) {
      const codeLength = codes[0].length
      maxLength = Math.max(maxLength, codeLength)
    }
  }
  
  // 如果测试字符没有找到合适的结果，遍历所有字符
  if (maxLength === 0) {
    for (const codes of codeTable.values()) {
      if (codes && codes.length > 0) {
        const codeLength = codes[0].length
        maxLength = Math.max(maxLength, codeLength)
      }
    }
  }
  
  return maxLength || 4 // 默认4位
}

// 處理碼表上傳成功
const handleCodeTableUpload = async (data: { codeTable: CodeTable; fileName: string; format: string; tableKey?: string; isPrefix?: boolean; prefixKeys?: string[] }) => {
  console.log('[App] 開始處理碼表上傳:', data.fileName, data.codeTable.size)
  
  // 先計算最大碼長
  const maxLength = calculateMaxCodeLength(data.codeTable)
  
  // 立即處理碼表，生成所有派生版本（包含字頻優化）
  console.log('[App] 開始處理碼表...')
  await codeTableProcessingService.processCodeTable(data.codeTable, {
    isPrefix: data.isPrefix || false,
    maxLength: maxLength,
    prefixKeys: data.prefixKeys
  })
  console.log('[App] 碼表處理完成')
  
  // 確保處理完全完成後，再更新響應式數據
  await nextTick()
  
  // 處理完成後，再更新響應式數據（這會觸發 ComparisonCard 的監聽器）
  console.log('[App] 更新響應式數據...')
  codeTable.value = data.codeTable
  globalMaxLength.value = maxLength
  uploadPrefixFlag.value = data.isPrefix || false
  uploadPrefixKeys.value = data.prefixKeys || []
  
  // 如果是預設方案，从fileName中提取名称（格式：預設方案：方案名）
  if (data.tableKey && data.fileName.startsWith('預設方案：')) {
    codeTableName.value = data.fileName.replace('預設方案：', '')
  } else {
    codeTableName.value = data.fileName.replace(/\.(txt|csv)$/, '')
  }
  
  analysisReady.value = true
  
  // 生成分析數據
  analysisData.value = generateAnalysis(data.codeTable)
  
  // 保存到本地存儲
  saveCodeTableData()
  
  console.log('[App] 碼表上傳處理完成')
  
  // 碼表分析成功後，自動滾動到第一個分析卡片
  setTimeout(() => {
    const firstAnalysisCard = document.getElementById('card-duplicate')
    if (firstAnalysisCard) {
      firstAnalysisCard.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }, 500) // 延遲500ms，讓用戶看到成功反饋
  
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

// 清理所有本地緩存數據
const clearAllCache = () => {
  try {
    // 確認用戶是否真的要清理所有數據
    if (!confirm('確定要清理所有本地緩存數據嗎？這將包括：\n\n• 已上傳的碼表數據\n• 所有方案對比數據\n• 分析結果\n• 用戶設定\n\n清理後頁面將重新載入。')) {
      return
    }
    
    // 獲取所有localStorage鍵值
    const allKeys = Object.keys(localStorage)
    
    // 清除所有相關的鍵值
    const keysToRemove = [
      'savedCodeTable',              // 主碼表數據
      'yuhao-comparison-schemes',    // 方案對比數據
      'comparisonSchemes',           // 舊版本方案對比數據
      'uploadedCodeTable',
      'codeTableName',
      'analysisData',
      'userSettings',
      'cacheTimestamp',
      'theme'                        // 主題設定
    ]
    
    // 直接清除已知鍵值
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // 清除所有以特定前綴開頭或包含特定關鍵字的keys
    allKeys.forEach(key => {
      if (
        key.startsWith('yuhao') ||
        key.startsWith('codeTable') ||
        key.startsWith('analysis') ||
        key.includes('comparison') ||
        key.includes('scheme') ||
        key.includes('codetable') ||
        key.includes('cache')
      ) {
        localStorage.removeItem(key)
      }
    })
    
    // 清理所有sessionStorage（如果有的話）
    sessionStorage.clear()
    
    // 提示用戶並重新載入頁面
    alert('所有本地緩存數據已清除，頁面將重新載入')
    
    // 重新載入頁面
    window.location.reload()
  } catch (error) {
    console.error('清除緩存時發生錯誤:', error)
    alert('清除緩存失敗，請手動重新整理頁面')
  }
}

// 導出所有分析卡片到一張圖片
const exportAllCards = async () => {
  try {
    // 檢查是否有已上傳的碼表
    if (!analysisReady.value) {
      alert('請先上傳碼表文件後再進行導出操作')
      return
    }

    // 顯示格式選擇對話框
    const formatChoice = await showFormatDialog()
    if (!formatChoice) {
      return // 用戶取消了操作
    }

    // 確保所有卡片都展開，以便截圖包含完整內容
    const cardsToExpand = [
      duplicateAnalysisCardRef.value,
      maximumCandidatesCardRef.value, 
      speedEquivCardRef.value,
      shortCodeEfficiencyCardRef.value,
      keyboardHeatmapCardRef.value
    ]

    // 展開所有卡片
    cardsToExpand.forEach(cardRef => {
      if (cardRef && typeof cardRef.expand === 'function') {
        cardRef.expand()
      }
    })

    // 等待DOM更新
    await nextTick()
    
    // 等待一點時間確保所有內容都渲染完成
    await new Promise(resolve => setTimeout(resolve, 500))

    // 獲取所有要導出的卡片元素
    const cardSelectors = [
      '#card-duplicate',
      '#card-maximum', 
      '#card-speed',
      '#card-efficiency',
      '#card-heatmap'
    ]
    
    const cardElements = cardSelectors
      .map(selector => document.querySelector(selector))
      .filter(element => element !== null)
    
    if (cardElements.length === 0) {
      alert('未找到可導出的分析卡片')
      return
    }

    // 創建一個高清容器來組合所有卡片
    const container = document.createElement('div')
    container.style.cssText = `
      background: #f8fafc;
      padding: 20px;
      width: 1000px;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.6;
    `

    // 添加標題
    const header = document.createElement('div')
    header.style.cssText = `
      text-align: center;
      margin-bottom: 40px;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    `
    header.innerHTML = `
      <h1 style="margin: 0; font-size: 36px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${codeTableName.value}</h1>
      <p style="margin: 15px 0 8px 0; font-size: 20px; opacity: 0.95;">輸入法分析報告</p>
      <p style="margin: 0; font-size: 16px; opacity: 0.85;">宇浩測評網 · ceping.shurufa.app</p>
    `
    container.appendChild(header)

    // 複製每個卡片元素（提高清晰度）
    for (const element of cardElements) {
      if (!element) continue // 跳過空元素
      
      const clonedElement = element.cloneNode(true) as HTMLElement
      
      // 確保樣式正確應用並提高清晰度
      clonedElement.style.cssText += `
        margin-bottom: 35px;
        width: 100%;
        box-sizing: border-box;
        transform: scale(1);
        font-size: 16px;
        line-height: 1.6;
      `
      
      container.appendChild(clonedElement)
    }

    // 將容器暫時添加到body中（隱藏）
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '0'
    document.body.appendChild(container)

    try {
      if (formatChoice === 'pdf') {
        await exportToPDF(container)
      } else {
        await exportToImage(container)
      }
    } finally {
      // 清理：移除臨時容器
      document.body.removeChild(container)
    }

  } catch (error) {
    console.error('導出分析卡片失敗:', error)
    alert('導出失敗，請稍後重試')
  }
}

// 顯示格式選擇對話框
const showFormatDialog = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const dialog = document.createElement('div')
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `
    
    dialog.innerHTML = `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 30px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        max-width: 400px;
        width: 90%;
        text-align: center;
      ">
        <h3 style="margin: 0 0 20px 0; color: #374151; font-size: 24px;">選擇導出格式</h3>
        <p style="margin: 0 0 30px 0; color: #6b7280; line-height: 1.6;">請選擇您希望的導出格式：</p>
        
        <div style="display: flex; gap: 15px; margin-bottom: 25px;">
          <button id="pdf-btn" style="
            flex: 1;
            padding: 15px 20px;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
          ">
            📄 文檔<br>
            <small style="opacity: 0.9; font-weight: 400;">PDF 格式</small>
          </button>
          
          <button id="image-btn" style="
            flex: 1;
            padding: 15px 20px;
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 8px rgba(5, 150, 105, 0.3);
          ">
            🖼️ 圖片<br>
            <small style="opacity: 0.9; font-weight: 400;">PNG 格式</small>
          </button>
        </div>
        
        <button id="cancel-btn" style="
          padding: 12px 30px;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        ">取消</button>
      </div>
    `
    
    document.body.appendChild(dialog)
    
    // 添加懸停效果
    const pdfBtn = dialog.querySelector('#pdf-btn') as HTMLElement
    const imageBtn = dialog.querySelector('#image-btn') as HTMLElement
    const cancelBtn = dialog.querySelector('#cancel-btn') as HTMLElement
    
    pdfBtn.addEventListener('mouseenter', () => {
      pdfBtn.style.transform = 'translateY(-2px)'
      pdfBtn.style.boxShadow = '0 8px 16px rgba(220, 38, 38, 0.4)'
    })
    pdfBtn.addEventListener('mouseleave', () => {
      pdfBtn.style.transform = 'translateY(0)'
      pdfBtn.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)'
    })
    
    imageBtn.addEventListener('mouseenter', () => {
      imageBtn.style.transform = 'translateY(-2px)'
      imageBtn.style.boxShadow = '0 8px 16px rgba(5, 150, 105, 0.4)'
    })
    imageBtn.addEventListener('mouseleave', () => {
      imageBtn.style.transform = 'translateY(0)'
      imageBtn.style.boxShadow = '0 4px 8px rgba(5, 150, 105, 0.3)'
    })
    
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = '#e5e7eb'
    })
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = '#f3f4f6'
    })
    
    // 事件處理
    pdfBtn.addEventListener('click', () => {
      document.body.removeChild(dialog)
      resolve('pdf')
    })
    
    imageBtn.addEventListener('click', () => {
      document.body.removeChild(dialog)
      resolve('image')
    })
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(dialog)
      resolve(null)
    })
    
    // 點擊遮罩關閉
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog)
        resolve(null)
      }
    })
  })
}

// 導出為高清圖片
const exportToImage = async (container: HTMLElement) => {
  // 動態導入html2canvas
  const { default: html2canvas } = await import('html2canvas')
  
  // 使用html2canvas截圖（高清設定）
  const canvas = await html2canvas(container, {
    width: 1000,
    height: container.offsetHeight,
    scale: 3, // 提高到3倍分辨率
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#f8fafc',
    logging: false,
    imageTimeout: 15000,
    onclone: (clonedDoc) => {
      // 確保克隆文檔中的樣式正確
      const clonedContainer = clonedDoc.querySelector('div') as HTMLElement
      if (clonedContainer) {
        clonedContainer.style.position = 'static'
        clonedContainer.style.left = 'auto'
      }
    }
  })

  // 創建下載鏈接
  const link = document.createElement('a')
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
  link.download = `${codeTableName.value}_測評報告_宇浩測評網_${today}.png`
  link.href = canvas.toDataURL('image/png', 1.0)
  
  // 觸發下載
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  console.log('高清圖片導出成功')
}

// 導出為PDF
const exportToPDF = async (container: HTMLElement) => {
  try {
    // 動態導入jsPDF和html2canvas
    const [{ default: html2canvas }, jsPDFModule] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ])
    
    const { jsPDF } = jsPDFModule
    
    // 使用html2canvas截圖（高清設定）
    const canvas = await html2canvas(container, {
      width: 1000,
      height: container.offsetHeight,
      scale: 2, // 使用2倍分辨率
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f8fafc',
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        const clonedContainer = clonedDoc.querySelector('div') as HTMLElement
        if (clonedContainer) {
          clonedContainer.style.position = 'static'
          clonedContainer.style.left = 'auto'
        }
      }
    })

    // 計算PDF尺寸 - 單頁模式，保持正確寬高比
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const aspectRatio = canvasHeight / canvasWidth
    
    const pdfWidth = 210 // A4 寬度 (mm)
    const margin = 10
    const availableWidth = pdfWidth - (margin * 2) // 可用寬度
    
    // 根據可用寬度計算圖片高度，保持寬高比
    const imgWidth = availableWidth
    const imgHeight = availableWidth * aspectRatio
    
    // PDF總高度 = 圖片高度 + 上下邊距
    const pdfHeight = Math.max(297, imgHeight + (margin * 2))
    
    // 創建長頁PDF（單頁模式，不分頁）
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight] // 使用計算出的精確尺寸
    })
    
    const imgData = canvas.toDataURL('image/png', 1.0)
    
    // 將整個圖片放在單頁上，保持正確比例
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight)
    
    // 下載PDF
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    pdf.save(`${codeTableName.value}_測評報告_宇浩測評網_${today}.pdf`)
    
    console.log('單頁PDF導出成功')
    
  } catch (error) {
    console.error('PDF導出失敗:', error)
    alert('PDF導出失敗，已改為圖片格式導出')
    // 如果PDF失敗，回退到圖片
    await exportToImage(container)
  }
}
</script>

<style scoped>
/* 頭部樣式保持原有設計 */
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
  flex-wrap: nowrap !important; /* 強制不換行 */
  gap: var(--spacing-sm);
  width: 100%;
  min-height: 0; /* 允許收縮 */
  overflow: hidden;
}

.logo {
  flex: 1 1 auto; /* 允許logo收縮和擴展 */
  min-width: 0; /* 允許收縮到內容以下 */
  overflow: hidden;
  text-overflow: ellipsis; /* 如果logo過長則用省略號 */
}

.header-actions {
  flex: 0 0 auto; /* 防止按鈕收縮或擴展 */
  display: flex;
  align-items: center;
  white-space: nowrap; /* 強制按鈕容器不換行 */
  display: flex;
  align-items: center;
}

.logo h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0; /* 移除下邊距，因為刪除了副標題 */
}

.logo-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
}

.logo-link:hover {
  opacity: 0.8;
}

.logo-image {
  height: 1.75rem; /* 与标题字体大小一致 */
  width: auto;
  object-fit: contain;
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

/* 全局下載按鈕特殊樣式 */
.download-all-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border: 1px solid rgba(16, 185, 129, 0.3) !important;
  color: white !important;
  font-weight: 500;
  gap: 6px;
  min-width: 100px;
  padding: 8px 12px !important;
}

.download-all-button:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  border-color: rgba(16, 185, 129, 0.5) !important;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* 頭部導出按鈕樣式 - 與卡片保持一致 */
.header .export-btn {
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

.header .export-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
  transform: scale(1.05);
}

.header .export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  padding: var(--spacing-sm) var(--spacing-lg);
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
  .header {
    padding: var(--spacing-md) 0; /* 减少header的垂直padding */
  }
  
  .header-content {
    gap: var(--spacing-xs); /* 在小屏幕上减少logo和按钮之间的间距 */
  }
  
  .logo h1 {
    font-size: 1.25rem; /* 进一步减小标题字体 */
  }
  
  .logo-image {
    height: 1.25rem; /* 相应减少logo大小 */
  }
  
  .logo-link {
    gap: calc(var(--spacing-xs) / 2); /* 减少logo和标题之间的间距 */
  }
  
  .header-actions {
    gap: var(--spacing-xs); /* 减少按钮间距 */
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
  background: linear-gradient(135deg, #ea476d 0%, #b13846 100%);
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
  .header {
    padding: var(--spacing-sm) 0;
  }
  
  .header-content {
    gap: 2px !important; /* 强制最小间距 */
    width: 100%;
    overflow: hidden;
  }
  
  .logo {
    flex: 1 1 50% !important; /* 限制logo最大宽度为50% */
    max-width: 50%;
    min-width: 0;
  }
  
  .logo h1 {
    font-size: 0.8rem !important; /* 更小的字体 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .logo-image {
    height: 0.8rem;
    flex-shrink: 0;
  }
  
  .logo-link {
    gap: 2px;
    min-width: 0;
    overflow: hidden;
  }
  
  .header-actions {
    gap: 2px !important;
    flex: 0 0 auto !important; /* 强制固定尺寸 */
    white-space: nowrap !important;
  }
  
  .action-button {
    padding: 2px !important; /* 最小padding */
    min-width: 28px; /* 固定最小宽度 */
    width: 28px; /* 固定宽度 */
    height: 28px; /* 固定高度 */
    flex-shrink: 0 !important; /* 绝对不允许收缩 */
  }
  
  .action-button svg {
    width: 16px !important;
    height: 16px !important;
  }
  
  /* 头部导出按钮在移动端与其他按钮保持一致 */
  .header .export-btn {
    padding: 2px !important;
    min-width: 28px !important;
    width: 28px !important;
    height: 28px !important;
    flex-shrink: 0 !important;
  }
  
  .header .export-btn svg {
    width: 16px !important;
    height: 16px !important;
  }
  
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

/* 极小屏幕优化 - 最强约束 */
@media (max-width: 360px) {
  .header {
    padding: 2px 0 !important; /* 最小header padding */
  }
  
  .header-content {
    gap: 1px !important; /* 最小间距 */
    width: 100%;
  }
  
  .logo {
    flex: 1 1 40% !important; /* 进一步限制logo空间 */
    max-width: 40%;
    min-width: 0;
  }
  
  .logo h1 {
    font-size: 0.7rem !important; /* 极小字体 */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .logo-image {
    height: 0.7rem; /* 极小logo */
    flex-shrink: 0;
  }
  
  .logo-link {
    gap: 1px; /* 最小间距 */
    min-width: 0;
    overflow: hidden;
  }
  
  .header-actions {
    gap: 1px !important; /* 最小按钮间距 */
    flex: 0 0 auto !important;
    white-space: nowrap !important;
  }
  
  .action-button {
    padding: 1px !important; /* 最小padding */
    min-width: 24px !important; /* 更小的固定宽度 */
    width: 24px !important;
    height: 24px !important;
    flex-shrink: 0 !important;
    font-size: 0; /* 隐藏可能的文本 */
  }
  
  .action-button svg {
    width: 14px !important; /* 更小图标 */
    height: 14px !important;
  }
  
  /* 头部导出按钮在小屏幕下与其他按钮保持一致 */
  .header .export-btn {
    padding: 1px !important;
    min-width: 24px !important;
    width: 24px !important;
    height: 24px !important;
    flex-shrink: 0 !important;
    font-size: 0;
  }
  
  .header .export-btn svg {
    width: 14px !important;
    height: 14px !important;
  }
}
</style>
