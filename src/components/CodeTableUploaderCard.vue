<template>
  <div class="code-table-uploader upload-card">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">碼表上傳</h3>
          <p class="card-description">選擇預設方案或上傳您的輸入法碼表文件進行性能分析。</p>
        </div>
        <button @click="toggleCollapsed" class="collapse-button">
          <svg :class="{ 'rotated': isCollapsed }" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-show="!isCollapsed" class="card-content">
    <!-- 預設碼表選擇 -->
    <div class="builtin-selector">
      <label class="builtin-label">預設方案：</label>
      <div class="builtin-content">
        <select 
          v-model="selectedBuiltinTable" 
          class="builtin-select"
          @change="handleBuiltinTableChange"
          :disabled="isUploading"
        >
          <option value="">選擇預設方案...</option>
          <option 
            v-for="table in builtinTables" 
            :key="table.key" 
            :value="table.key"
          >
            {{ table.name }} - {{ table.description }}
          </option>
        </select>
      </div>
    </div>

    <!-- 分隔線 -->
    <div class="divider">
      <span class="divider-text">或者</span>
    </div>

    <!-- 格式選擇 -->
    <div class="format-selector">
      <label class="format-label">碼表格式：</label>
      <div class="format-content">
        <div class="format-options">
          <label class="format-option">
            <input 
              type="radio" 
              value="char_first" 
              v-model="selectedFormat"
              name="format"
            />
            <span class="format-text">字符-編碼</span>
            <span class="format-example">例：的 de</span>
          </label>
          <label class="format-option">
            <input 
              type="radio" 
              value="code_first" 
              v-model="selectedFormat"
              name="format"
            />
            <span class="format-text">編碼-字符</span>
            <span class="format-example">例：de 的</span>
          </label>
        </div>
        <div class="prefix-control">
          <div class="prefix-keys-input" v-if="isPrefixCode">
            <input 
              v-model="prefixKeysInput"
              placeholder="輸入已編入碼表的上屏碼，如 aoeiu_;"
              title="輸入上屏碼，如: aoeiu;'"
              class="prefix-keys-field"
              type="text"
            />
          </div>
          <div class="prefix-button-group">
            <button 
              @click="togglePrefixMode" 
              :class="['prefix-button', { 'active': isPrefixCode }]"
              title="切換前綴碼模式"
              type="button"
            >
              {{ isPrefixCode ? '✓ 我是前綴或頂功方案' : '我是前綴或頂功方案' }}
            </button>
            <button 
              @click="showPrefixHelp = true"
              class="help-button"
              title="點擊幫助"
              type="button"
            >
              ?
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件上传区域 -->
    <div 
      class="upload-area"
      :class="{ 
        'drag-over': isDragOver,
        'has-file': selectedFile,
        'uploading': isUploading
      }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input 
        ref="fileInput"
        type="file"
        accept=".txt,.csv,.yaml,.yml"
        @change="handleFileSelect"
        style="display: none"
      />
      
      <div class="upload-content">
        <div v-if="isUploading" class="uploading-state">
          <div class="spinner"></div>
          <p>正在解析碼表...</p>
        </div>
        
        <div v-else-if="selectedFile" class="file-selected">
          <div class="file-icon">📄</div>
          <div class="file-info">
            <p class="file-name">{{ selectedFile.name }}</p>
            <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
          </div>
          <button class="btn btn-secondary remove-file" @click.stop="removeFile">
            ✕
          </button>
        </div>
        
        <div v-else class="upload-prompt">
          <div class="upload-icon">⬆️</div>
          <p class="upload-title">點擊上傳或拖拽文件到此處</p>
          <p class="upload-subtitle">支持 .txt、.csv、.yaml 和 .yml 格式</p>
          <p class="upload-note">
            文件格式：每行一個字符和編碼，用空格或制表符分隔
          </p>
        </div>
      </div>
    </div>

    <!-- 上傳按鈕 -->
    <div class="upload-actions">
      <button 
        class="btn btn-primary upload-btn"
        :disabled="!selectedFile || isUploading"
        @click="processFile"
      >
        <span v-if="isUploading">解析中...</span>
        <span v-else>開始分析</span>
      </button>
      
      <button 
        v-if="selectedFile"
        class="btn btn-secondary"
        @click="removeFile"
        :disabled="isUploading"
      >
        重新選擇
      </button>
    </div>

    <!-- 預覽區域 -->
    <div v-if="previewData.length > 0" class="preview-section">
      <h4 class="preview-title">文件預覽（前100行）</h4>
      <div class="preview-content">
        <div 
          v-for="(line, index) in previewData" 
          :key="index"
          class="preview-line"
          :class="{ 'invalid': !line.valid }"
        >
          <span class="line-number">{{ index + 1 }}</span>
          <span class="line-content">{{ line.raw }}</span>
          <span v-if="line.valid" class="line-parsed">
            → {{ selectedFormat === 'char_first' ? line.char + ' : ' + line.code : line.code + ' : ' + line.char }}
          </span>
          <span v-else class="line-error">忽略本行</span>
        </div>
      </div>
    </div>

    <!-- 碼表編碼分析預覽 -->
    <div v-if="encodingPreviewData.length > 0" class="encoding-preview-section">
      <h4 class="preview-title">編碼預覽（前100字）</h4>
      <div class="encoding-table-container">
        <table class="encoding-table">
          <thead>
            <tr>
              <th class="row-header">行號</th>
              <th class="char-header">漢字</th>
              <th class="code-header">全碼</th>
              <th class="code-header">簡碼</th>
              <th class="code-header">全碼及選重鍵</th>
              <th class="code-header">簡碼及選重鍵</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in encodingPreviewData" :key="index" class="encoding-row">
              <td class="row-number">{{ index + 1 }}</td>
              <td class="char-cell">{{ item.char }}</td>
              <td class="code-cell">{{ item.fullCode || '-' }}</td>
              <td class="code-cell">{{ item.shortCode || '-' }}</td>
              <td class="code-cell selection">{{ item.fullWithSelection || '-' }}</td>
              <td class="code-cell selection">{{ item.shortWithSelection || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- 上傳狀態顯示 -->
        <!-- 上傳狀態顯示 -->
    <div v-if="props.uploadStatus" class="upload-status" :class="props.uploadStatus.type">
      <span class="status-icon">
        {{ props.uploadStatus.type === 'success' ? '✓' : '✗' }}
      </span>
      {{ props.uploadStatus.message }}
    </div>
    </div>
  </div>
  
  <!-- 前綴碼幫助信息框 - 使用 Teleport 傳送到 body -->
  <Teleport to="body">
    <div v-if="showPrefixHelp" class="help-modal-overlay" @click="showPrefixHelp = false">
      <div class="help-modal" @click.stop>
        <div class="help-header">
          <h4>前綴或頂功方案説明</h4>
          <button @click="showPrefixHelp = false" class="help-close-btn">×</button>
        </div>
        <div class="help-content">
          <p><a href="https://shurufa.app/docs/concepts.html">前綴或頂功方案</a>是一類特殊上屏候選字的輸入方案，對於未達到最大碼長的候選項，在某些特殊的模式下，可以自動上屏，而不需要使用空格鍵。比如日月輸入法、聲筆飛單、逸碼等。</p>
          <p><strong>上屏碼設置：</strong></p>
          <p>勾選了前綴或頂功的方案，可以在輸入框中填入特定的上屏按鍵，例如："aoeiu_" 表示編碼結尾是 a、o、e、i、u、空格等按鍵的，不再自動添加空格；編碼結尾是其他按鍵的，未達到最大碼長時，仍舊添加空格。</p>
          <p>勾選了前綴或頂功的方案，且未填寫任何上屏按鍵的，則在任何情况下都不自動添加空格鍵。</p>
          <p>如果你的碼表已經將空格鍵等特殊符號作爲編碼的一部分，可填寫到輸入框中，避免本測評工具自動添加空格鍵。</p>
          <p><strong>注意：</strong></p>
          <p>請謹慎使用本功能，不要利用它來取得更好的碼長計算結果。</p>
        </div>
        <div class="help-footer">
          <button @click="showPrefixHelp = false" class="btn btn-primary">我知道了</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useCollapse } from '../composables/useCollapse'
import type { CodeTable, CodeTableFormat, ParseResult, UploadStatus } from '../types/index'
import { BuiltinCodeTableService } from '../services/builtinCodeTableService'
import { CodeTableProcessingService } from '../services/codeTableProcessingService'

// 定义 props
interface Props {
  uploadStatus?: UploadStatus | null
}

const props = withDefaults(defineProps<Props>(), {
  uploadStatus: null
})

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 暴露折叠方法给父组件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

// 定义 emits
const emit = defineEmits<{
  uploadSuccess: [data: { codeTable: CodeTable; fileName: string; format: CodeTableFormat; tableKey?: string; isPrefix?: boolean; prefixKeys?: string[] }]
  uploadError: [error: string]
}>()

// 預設碼表相關
const builtinService = new BuiltinCodeTableService()
const selectedBuiltinTable = ref('')
const builtinTables = ref<Array<{key: string, name: string, description: string}>>([])

// 響應式數據
const selectedFormat = ref<CodeTableFormat>('char_first')
const selectedFile = ref<File | null>(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const isPrefixCode = ref(false)
const prefixKeysInput = ref('')
const showPrefixHelp = ref(false)
const fileInput = ref<HTMLInputElement>()
const previewData = ref<Array<{
  raw: string
  char: string
  code: string
  valid: boolean
}>>([])

// 編碼預覽數據
const encodingPreviewData = ref<Array<{
  char: string
  fullCode: string
  shortCode: string
  fullWithSelection: string
  shortWithSelection: string
}>>([])

// 碼表處理服務實例
const processingService = CodeTableProcessingService.getInstance()

// 檢查處理狀態並生成編碼預覽
const checkProcessingStatus = () => {
  const processedTables = processingService.getProcessedTables()
  if (processedTables && encodingPreviewData.value.length === 0) {
    // 短暫延遲確保處理完成
    setTimeout(() => {
      generateEncodingPreview()
    }, 100)
  }
}

// 定期檢查處理狀態
let statusCheckInterval: number | null = null
const startStatusCheck = () => {
  if (statusCheckInterval) clearInterval(statusCheckInterval)
  statusCheckInterval = setInterval(checkProcessingStatus, 500)
}

const stopStatusCheck = () => {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval)
    statusCheckInterval = null
  }
}

// 文件大小格式化
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 觸發文件選擇
const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

// 切换前缀码模式
const togglePrefixMode = () => {
  isPrefixCode.value = !isPrefixCode.value
}

// 處理拖拽
const handleDragOver = (event: DragEvent) => {
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    handleFileSelection(files[0])
  }
}

// 處理文件選擇
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    handleFileSelection(target.files[0])
  }
}

// 文件選擇處理
const handleFileSelection = (file: File) => {
  // 检查文件类型
  const fileName = file.name.toLowerCase()
  if (!fileName.endsWith('.txt') && !fileName.endsWith('.csv') && !fileName.endsWith('.yaml') && !fileName.endsWith('.yml')) {
    emit('uploadError', '请选择 .txt、.csv、.yaml 或 .yml 格式的文件')
    return
  }

  // 检查文件大小（10MB限制）
  if (file.size > 10 * 1024 * 1024) {
    emit('uploadError', '文件大小不能超过 10MB')
    return
  }

  // 清除預設碼表選擇
  selectedBuiltinTable.value = ''
  
  selectedFile.value = file
  generatePreview(file)
}

// YAML 行解析函數
const parseYamlLine = (line: string): { char: string; code: string; valid: boolean } => {
  const trimmed = line.trim()
  
  // 跳過註釋、空行、YAML 元數據
  if (!trimmed || 
      trimmed.startsWith('#') || 
      trimmed.startsWith('---') || 
      trimmed.startsWith('...') || 
      trimmed.includes(':') && (trimmed.startsWith('name:') || trimmed.startsWith('version:') || trimmed.startsWith('sort:') || trimmed.startsWith('columns:'))) {
    return { char: '', code: '', valid: false }
  }
  
  // 跳過 columns 元素行
  if (trimmed === '- text' || trimmed === '- code') {
    return { char: '', code: '', valid: false }
  }
  
  // 解析字符-編碼行，支持制表符分隔
  const parts = trimmed.split(/\t+/)
  if (parts.length >= 2) {
    const char = parts[0].trim()
    const code = parts[1].trim()
    const valid = Array.from(char).length === 1 && code.length > 0
    return { char, code, valid }
  }
  
  return { char: '', code: '', valid: false }
}

// 通用行解析函數
const parseLine = (line: string, isYaml: boolean): { char: string; code: string; valid: boolean } => {
  if (isYaml) {
    return parseYamlLine(line)
  }
  
  // 原有的 TXT/CSV 解析邏輯
  const trimmed = line.trim()
  if (!trimmed) return { char: '', code: '', valid: false }
  
  // 更健壯的分割邏輯：使用制表符或多個空格作爲分隔符
  const parts = trimmed.split(/\t+|\s{2,}|\s+/)
  // 如果只有一個空格分隔，確保只分割成2部分
  if (parts.length < 2) {
    // 嘗試按第一個空格分割
    const spaceIndex = trimmed.indexOf(' ')
    if (spaceIndex > 0) {
      const char_part = trimmed.substring(0, spaceIndex).trim()
      const code_part = trimmed.substring(spaceIndex + 1).trim()
      if (char_part && code_part) {
        parts.length = 0
        parts.push(char_part, code_part)
      }
    }
  }
  
  if (parts.length < 2) return { char: '', code: '', valid: false }
  
  let char: string, code: string
  if (selectedFormat.value === 'char_first') {
    char = parts[0]
    code = parts[1]
  } else {
    code = parts[0]
    char = parts[1]
  }
  
  // 验证是否为单个字符
  const valid = Array.from(char).length === 1 && code.length > 0
  
  return { char, code, valid }
}

// 生成文件預覽
const generatePreview = async (file: File) => {
  try {
    const text = await readFileAsText(file)
    const lines = text.split('\n').slice(0, 100) // 增加預覽行數，支持滚動查看
    const isYaml = file.name.toLowerCase().endsWith('.yaml') || file.name.toLowerCase().endsWith('.yml')
    
    previewData.value = lines.map(line => {
      const result = parseLine(line, isYaml)
      return { 
        raw: line, 
        char: result.char, 
        code: result.code, 
        valid: result.valid 
      }
    })
  } catch (error) {
    console.error('生成预览失败:', error)
  }
}

// 生成編碼預覽數據
const generateEncodingPreview = () => {
  const processedTables = processingService.getProcessedTables()
  if (!processedTables) {
    encodingPreviewData.value = []
    return
  }

  const { original, full, short, fullWithSelection, shortWithSelection } = processedTables
  const previewItems: Array<{
    char: string
    fullCode: string
    shortCode: string
    fullWithSelection: string
    shortWithSelection: string
  }> = []

  // 為了保持原始碼表的順序，我們需要從 previewData 中獲取單字順序
  const orderedChars: string[] = []
  
  if (previewData.value.length > 0) {
    // 從文件預覽數據中獲取已解析的單字，保持原始文件順序
    for (const line of previewData.value) {
      if (line.valid && line.char && Array.from(line.char).length === 1) {
        if (!orderedChars.includes(line.char)) {
          orderedChars.push(line.char)
        }
      }
    }
  }
  
  // 如果從預覽數據中獲取的單字不足100個，從原始碼表中補充
  if (orderedChars.length < 100) {
    for (const char of original.keys()) {
      if (orderedChars.length >= 100) break
      if (Array.from(char).length === 1 && !orderedChars.includes(char)) {
        orderedChars.push(char)
      }
    }
  }

  // 獲取前100個單字的編碼信息
  const maxCount = Math.min(100, orderedChars.length)
  for (let i = 0; i < maxCount; i++) {
    const char = orderedChars[i]
    
    // 檢查該字符是否在所有碼表中都存在
    if (!original.has(char)) continue

    const fullCodes = full.get(char) || []
    const shortCodes = short.get(char) || []
    const fullWithSelectionCodes = fullWithSelection.get(char) || []
    const shortWithSelectionCodes = shortWithSelection.get(char) || []

    previewItems.push({
      char,
      fullCode: fullCodes[0] || '-',
      shortCode: shortCodes[0] || '-',
      fullWithSelection: fullWithSelectionCodes[0] || '-',
      shortWithSelection: shortWithSelectionCodes[0] || '-'
    })
  }

  encodingPreviewData.value = previewItems
}

// 移除文件
const removeFile = () => {
  selectedFile.value = null
  previewData.value = []
  encodingPreviewData.value = []
  stopStatusCheck()
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 读取文件内容
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'utf-8')
  })
}

// 解析码表
const parseCodeTable = (text: string, format: CodeTableFormat, fileName: string): ParseResult => {
  const codeTable: CodeTable = new Map()
  const lines = text.split('\n')
  let totalCodes = 0
  const isYaml = fileName.toLowerCase().endsWith('.yaml') || fileName.toLowerCase().endsWith('.yml')

  for (const line of lines) {
    let char: string, code: string
    
    if (isYaml) {
      // YAML 格式解析
      const result = parseYamlLine(line)
      if (!result.valid) continue
      char = result.char
      code = result.code
    } else {
      // 原有的 TXT/CSV 解析邏輯
      const trimmed = line.trim()
      if (!trimmed) continue

      // 更健壮的分割逻辑：使用制表符或多个空格作为分隔符
      let parts = trimmed.split(/\t+|\s{2,}|\s+/)
      // 如果只有一个空格分隔，确保只分割成2部分
      if (parts.length < 2) {
        // 尝试按第一个空格分割
        const spaceIndex = trimmed.indexOf(' ')
        if (spaceIndex > 0) {
          const char_part = trimmed.substring(0, spaceIndex).trim()
          const code_part = trimmed.substring(spaceIndex + 1).trim()
          if (char_part && code_part) {
            parts = [char_part, code_part]
          }
        }
      }
      
      if (parts.length < 2) continue

      if (format === 'char_first') {
        char = parts[0].trim()
        code = parts[1].trim()
      } else {
        code = parts[0].trim()
        char = parts[1].trim()
      }
    }

    // 檢查是否爲單個Unicode字符（包括代理對）
    const isValidChar = (str: string): boolean => {
      if (!str) return false
      // 使用Array.from來正確處理Unicode字符
      const chars = Array.from(str)
      return Array.from(chars).length === 1
    }

    // 只处理单字
    if (isValidChar(char) && code.length > 0) {
      if (!codeTable.has(char)) {
        codeTable.set(char, [])
      }
      codeTable.get(char)!.push(code)
      totalCodes++
    }
  }

  return {
    codeTable,
    totalChars: codeTable.size,
    totalCodes,
    format
  }
}

// 处理文件
const processFile = async () => {
  if (!selectedFile.value) return

  isUploading.value = true

  try {
    const text = await readFileAsText(selectedFile.value)
    const result = parseCodeTable(text, selectedFormat.value, selectedFile.value.name)

    if (result.totalChars === 0) {
      emit('uploadError', '未找到有效的字符编码对，请检查文件格式')
      return
    }

    // 将 prefixKeysInput 转换为数组
    const prefixKeys = isPrefixCode.value && prefixKeysInput.value ? 
      Array.from(prefixKeysInput.value.trim()).filter(char => char !== ' ') : 
      undefined

    emit('uploadSuccess', {
      codeTable: result.codeTable,
      fileName: selectedFile.value.name,
      format: result.format,
      isPrefix: isPrefixCode.value,
      prefixKeys: prefixKeys
    })

    // 啟動狀態檢查以生成編碼預覽
    startStatusCheck()

  } catch (error) {
    emit('uploadError', `文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    isUploading.value = false
  }
}

// 載入預設碼表配置
async function loadBuiltinConfig() {
  try {
    await builtinService.loadConfig()
    builtinTables.value = builtinService.getAvailableTables()
  } catch (error) {
    console.error('載入預設碼表配置失敗:', error)
  }
}

// 處理預設碼表選擇變化
async function handleBuiltinTableChange() {
  // 當選擇預設碼表時，清除檔案選擇
  if (selectedBuiltinTable.value) {
    selectedFile.value = null
    previewData.value = []
    
    // 自動載入預設碼表
    await loadBuiltinTable()
  }
}

// 載入預設碼表
async function loadBuiltinTable() {
  if (!selectedBuiltinTable.value) return
  
  try {
    isUploading.value = true
    
    const result = await builtinService.downloadCodeTable(selectedBuiltinTable.value)
    
    // 获取内置方案的前缀码配置
    const tableConfig = builtinService.getTableConfig(selectedBuiltinTable.value)
    const isBuiltinPrefix = tableConfig?.isPrefix || false
    const builtinPrefixKeys = tableConfig?.prefixKeys
    
    // 更新前缀码按钮状态以反映配置
    isPrefixCode.value = isBuiltinPrefix
    // 更新前缀码输入框以反映配置
    if (builtinPrefixKeys && builtinPrefixKeys.length > 0) {
      prefixKeysInput.value = builtinPrefixKeys.join('')
    } else {
      prefixKeysInput.value = ''
    }
    
    emit('uploadSuccess', {
      codeTable: result.codeTable,
      fileName: `預設方案：${builtinTables.value.find(t => t.key === selectedBuiltinTable.value)?.name || selectedBuiltinTable.value}`,
      format: result.format,
      tableKey: selectedBuiltinTable.value,  // 添加tableKey用于前缀码检测
      isPrefix: isBuiltinPrefix,  // 使用配置中的前缀码属性
      prefixKeys: builtinPrefixKeys
    })

    // 啟動狀態檢查以生成編碼預覽
    startStatusCheck()

  } catch (error) {
    emit('uploadError', `載入預設碼表失敗: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isUploading.value = false
  }
}

// 組件清理
onUnmounted(() => {
  stopStatusCheck()
})

// 初始化
loadBuiltinConfig()
</script>

<style scoped>
/* 卡片头部布局 */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
}

.header-text {
  flex: 1;
}

/* 折叠按钮样式 */
.collapse-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  padding: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: var(--spacing-md); /* 保持原有间距，因为这个是必要的分离 */
  backdrop-filter: blur(10px);
}

.collapse-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

.collapse-button svg {
  transition: transform 0.3s ease;
}

.collapse-button svg.rotated {
  transform: rotate(180deg);
}

/* 原有样式 */
.code-table-uploader {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs); /* 从 var(--spacing-sm) 进一步减少到 var(--spacing-xs) */
}

/* 預設碼表選擇器樣式 */
.builtin-selector {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xs); /* 从 var(--spacing-sm) 进一步减少到 var(--spacing-xs) */
  background: var(--color-bg-secondary);
}

.builtin-label {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px; /* 从 var(--spacing-xs) 进一步减少到固定4px */
}

.builtin-content {
  display: flex;
  flex-direction: column;
  gap: 4px; /* 从 var(--spacing-xs) 进一步减少到固定4px */
}

.builtin-select {
  padding: 8px; /* 从 var(--spacing-sm) 进一步减少到固定8px */
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  min-height: 36px; /* 从 40px 进一步减少到 36px */
  font-family: inherit;
}

.builtin-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
}

.builtin-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.load-builtin-btn {
  align-self: flex-start;
}

/* 分隔線樣式 */
.divider {
  position: relative;
  text-align: center;
  margin: 8px 0; /* 从 var(--spacing-xs) 进一步减少到固定8px */
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--color-border);
}

.divider-text {
  background: var(--color-bg-primary);
  padding: 0 var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  position: relative;
  z-index: 1;
}

/* 格式选择器 */
.format-selector {
  display: flex;
  flex-direction: column;
  gap: 6px; /* 从 var(--spacing-xs) 进一步减少到固定6px */
}

.format-label {
  font-weight: 600;
  color: var(--color-text-primary);
}

.format-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.format-options {
  display: flex;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  flex: 1;
}

.format-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: 6px 8px; /* 从 var(--spacing-sm) 减少到固定6px 8px */
  border-radius: var(--radius-md);
  transition: background-color 0.2s ease-in-out;
}

.format-option:hover {
  background-color: var(--color-bg-tertiary);
}

.format-option input[type="radio"] {
  margin: 0;
}

.format-text {
  font-weight: 500;
  color: var(--color-text-primary);
}

.format-example {
  font-size: 0.8rem;
  color: var(--color-text-tertiary);
  font-family: var(--font-mono);
}

.prefix-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.prefix-button-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prefix-keys-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prefix-keys-field {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  transition: all 0.2s ease;
  min-width: 300px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.prefix-keys-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.prefix-keys-field::placeholder {
  color: #9ca3af;
  font-style: italic;
}

.prefix-button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 280px;
}

.help-button {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 50%;
  background: white;
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.help-button:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}

/* 幫助信息框樣式 */
.help-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999; /* 極高的z-index值確保在最上層 */
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

.help-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.help-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.help-close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.help-close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.help-content {
  padding: 20px 24px;
  color: #374151;
  line-height: 1.6;
  overflow-y: auto;
  max-height: 50vh;
}

.help-content p {
  margin: 0 0 12px 0;
}

.help-content ul {
  margin: 8px 0 16px 20px;
  padding: 0;
}

.help-content li {
  margin-bottom: 6px;
}

.help-content strong {
  color: #111827;
  font-weight: 600;
}

.help-footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 上传区域 */
.upload-area {
  border: 2px dashed var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md); /* 从 var(--spacing-lg) 减少到 var(--spacing-md) */
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: var(--color-bg-secondary);
}

.upload-area:hover {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
}

.upload-area.drag-over {
  border-color: var(--color-primary);
  background-color: var(--color-primary-light);
  transform: scale(1.02);
}

.upload-area.has-file {
  border-color: var(--color-success);
  background-color: var(--color-bg-primary);
}

.upload-area.uploading {
  border-color: var(--color-primary);
  cursor: not-allowed;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm); /* 从 var(--spacing-md) 减少到 var(--spacing-sm) */
}

/* 上传提示 */
.upload-icon {
  font-size: 2.5rem; /* 从 3rem 减少到 2.5rem */
  margin-bottom: var(--spacing-sm); /* 从 var(--spacing-md) 减少到 var(--spacing-sm) */
}

.upload-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.upload-subtitle {
  color: var(--color-text-secondary);
}

.upload-note {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  max-width: 400px;
}

/* 文件已选择状态 */
.file-selected {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background-color: var(--color-bg-tertiary);
  padding: var(--spacing-md); /* 从 var(--spacing-lg) 减少到 var(--spacing-md) */
  border-radius: var(--radius-md);
  width: 100%;
  max-width: 400px;
}

.file-icon {
  font-size: 2rem;
}

.file-info {
  flex: 1;
  text-align: left;
}

.file-name {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px; /* 从 var(--spacing-xs) 减少到固定4px */
}

.file-size {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.remove-file {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 1.2rem;
}

/* 上传中状态 */
.uploading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border-primary);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 操作按钮 */
.upload-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.upload-btn {
  min-width: 120px;
}

/* 预览区域 */
.preview-section {
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md); /* 从 var(--spacing-lg) 减少到 var(--spacing-md) */
}

.preview-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.preview-content {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  max-height: 320px; /* 大约12-15行的高度 */
  overflow-y: auto;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  background-color: var(--color-bg-primary);
}

.preview-line {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-secondary);
  margin: 0 calc(-1 * var(--spacing-sm)); /* 抵消容器的padding */
  padding-left: var(--spacing-sm);
  padding-right: var(--spacing-sm);
}

.preview-line:last-child {
  border-bottom: none;
}

.preview-line:hover {
  background-color: var(--color-bg-secondary);
}

.preview-line.invalid {
  opacity: 0.6;
  background-color: var(--color-bg-tertiary);
}

.line-number {
  width: 30px;
  color: var(--color-text-tertiary);
  font-size: 0.8rem;
}

.line-content {
  flex: 1;
  color: var(--color-text-secondary);
}

.line-parsed {
  color: var(--color-success);
  font-weight: 500;
}

.line-error {
  color: var(--color-error);
  font-weight: 500;
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
  .format-options {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .upload-area {
    padding: var(--spacing-xl);
  }
  
  .upload-actions {
    flex-direction: column;
  }
  
  .upload-btn {
    width: 100%;
  }
}

/* 暗黑模式專用樣式 */
[data-theme="dark"] .builtin-select {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-color: var(--color-border-primary);
}

[data-theme="dark"] .builtin-select:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1);
}

[data-theme="dark"] .prefix-button {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-color: var(--color-border-primary);
}

[data-theme="dark"] .prefix-button:hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-border-secondary);
}

[data-theme="dark"] .prefix-button.active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

[data-theme="dark"] .help-button {
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  border-color: var(--color-border-primary);
}

[data-theme="dark"] .help-button:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: var(--color-border-secondary);
}

[data-theme="dark"] .help-modal {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
}

[data-theme="dark"] .help-header {
  border-bottom-color: var(--color-border-primary);
}

[data-theme="dark"] .help-header h4 {
  color: var(--color-text-primary);
}

[data-theme="dark"] .help-close-btn {
  color: var(--color-text-secondary);
}

[data-theme="dark"] .help-close-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

[data-theme="dark"] .help-content {
  color: var(--color-text-primary);
}

[data-theme="dark"] .prefix-keys-field {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-color: var(--color-border-primary);
}

[data-theme="dark"] .prefix-keys-field:focus {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

/* 編碼預覽表格樣式 - 與文件預覽保持一致 */
.encoding-preview-section {
  margin-top: var(--spacing-lg);
}

.encoding-table-container {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg-primary);
}

.encoding-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}

.encoding-table thead {
  position: sticky;
  top: 0;
  background-color: var(--color-bg-secondary);
  z-index: 1;
}

.encoding-table th {
  padding: var(--spacing-sm) var(--spacing-xs);
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border-secondary);
  border-right: 1px solid var(--color-border-secondary);
  background-color: var(--color-bg-secondary);
}

.encoding-table th:last-child {
  border-right: none;
}

.row-header {
  width: 40px;
  text-align: center !important;
}

.char-header {
  width: 50px;
  text-align: center !important;
}

.code-header {
  min-width: 90px;
  font-size: 0.75rem;
}

.encoding-row {
  transition: background-color 0.15s ease;
}

.encoding-row:hover {
  background-color: var(--color-bg-secondary);
}

.encoding-table td {
  padding: var(--spacing-xs) var(--spacing-xs);
  border-bottom: 1px solid var(--color-border-secondary);
  border-right: 1px solid var(--color-border-secondary);
  font-size: 0.85rem;
  line-height: 1.4;
}

.encoding-table td:last-child {
  border-right: none;
}

.encoding-row:last-child td {
  border-bottom: none;
}

.row-number {
  width: 30px;
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 0.8rem;
}

.char-cell {
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.code-cell {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-align: left;
  padding: var(--spacing-xs);
}

.code-cell.selection {
  color: var(--color-success);
  font-weight: 500;
}
</style>
