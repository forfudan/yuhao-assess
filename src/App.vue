<template>
  <div id="app">
    <!-- 頭部導航 -->
    <header class="header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <h1>宇浩測評網</h1>
            <span class="subtitle">輸入法性能測評工具</span>
          </div>
          <nav class="nav">
            <a href="https://github.com/forfudan/yu" target="_blank" class="nav-link">
              宇浩輸入法
            </a>
            <a href="https://github.com/forfudan/assess" target="_blank" class="nav-link">
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </header>

    <!-- 主要內容區域 -->
    <main class="main">
      <div class="container">
        <div class="content-grid">
          <!-- 碼表上傳區塊 -->
          <section class="card upload-section">
            <h2 class="section-title">碼表上傳</h2>
            <p class="section-description">
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
          </section>

          <!-- 熱力圖分析區塊 -->
          <section class="card heatmap-section">
            <h2 class="section-title">鍵位熱力圖</h2>
            <p class="section-description">
              分析碼表的鍵位分布和使用頻率，可視化展示鍵位負擔。
            </p>
            
            <KeyboardHeatmap 
              :code-table="codeTable"
              :analysis-ready="analysisReady"
            />
          </section>

          <!-- 碼表分析區塊 -->
          <section v-if="analysisReady" class="card analysis-section">
            <h2 class="section-title">碼表分析</h2>
            <p class="section-description">
              詳細分析碼表的字符分布、編碼統計和top熱門條目。
            </p>
            
            <CodeTableViewer 
              :analysis="analysisData"
            />
          </section>
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
import { ref, reactive } from 'vue'
import CodeTableUploader from './components/CodeTableUploader.vue'
import KeyboardHeatmap from './components/KeyboardHeatmap.vue'
import CodeTableViewer from './components/CodeTableViewer.vue'
import type { CodeTable, UploadStatus, CodeTableAnalysis } from './types/index'

// 響應式數據
const codeTable = ref<CodeTable>(new Map())
const analysisReady = ref(false)
const uploadStatus = ref<UploadStatus | null>(null)
const analysisData = ref<CodeTableAnalysis | null>(null)

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
      cjkChars.A++
      regularChars++
      gbkChars++
    } else if (charCode >= 0x3400 && charCode <= 0x4dbf) {
      cjkChars.B++
    } else if (charCode >= 0x20000 && charCode <= 0x2a6df) {
      cjkChars.C++
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
  analysisReady.value = true
  
  // 生成分析數據
  analysisData.value = generateAnalysis(data.codeTable)
  
  uploadStatus.value = {
    type: 'success',
    message: `碼表 "${data.fileName}" 上傳成功！共 ${data.codeTable.size} 個字符`
  }

  // 3秒後清除狀態
  setTimeout(() => {
    uploadStatus.value = null
  }, 3000)

  console.log('碼表上傳成功:', {
    fileName: data.fileName,
    format: data.format,
    size: data.codeTable.size
  })
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

.main {
  padding: var(--spacing-2xl) 0;
  min-height: calc(100vh - 200px);
}

.content-grid {
  display: grid;
  gap: var(--spacing-2xl);
  grid-template-columns: 1fr;
}

@media (min-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.section-description {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

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

/* 響應式調整 */
@media (max-width: 768px) {
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
  
  .content-grid {
    gap: var(--spacing-xl);
  }
}
</style>
