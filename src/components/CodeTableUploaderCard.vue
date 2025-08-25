<template>
  <div class="code-table-uploader upload-card">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">碼表上傳</h3>
          <p class="card-description">上傳您的輸入法碼表文件進行性能分析。支持"字符-編碼"和"編碼-字符"兩種格式。</p>
        </div>
        <button @click="toggleCollapsed" class="collapse-button">
          <svg :class="{ 'rotated': isCollapsed }" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-show="!isCollapsed" class="card-content">
    <!-- 內置碼表選擇 -->
    <div class="builtin-selector">
      <label class="builtin-label">內置碼表方案：</label>
      <div class="builtin-content">
        <select 
          v-model="selectedBuiltinTable" 
          class="builtin-select"
          @change="handleBuiltinTableChange"
          :disabled="isUploading"
        >
          <option value="">選擇內置方案...</option>
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
          <button 
            @click="togglePrefixMode" 
            :class="['prefix-button', { 'active': isPrefixCode }]"
            title="切換前綴碼模式"
            type="button"
          >
            {{ isPrefixCode ? '✓ 本方案為前綴碼' : '本方案為前綴碼' }}
          </button>
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
        accept=".txt,.csv"
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
          <p class="upload-subtitle">支持 .txt 和 .csv 格式</p>
          <p class="upload-note">
            文件格式：每行一個字符和編碼，用空格或制表符分隔
          </p>
        </div>
      </div>
    </div>

    <!-- 上传按钮 -->
    <div class="upload-actions">
      <button 
        class="btn btn-primary upload-btn"
        :disabled="!selectedFile || isUploading"
        @click="processFile"
      >
        <span v-if="isUploading">解析中...</span>
        <span v-else>开始分析</span>
      </button>
      
      <button 
        v-if="selectedFile"
        class="btn btn-secondary"
        @click="removeFile"
        :disabled="isUploading"
      >
        重新选择
      </button>
    </div>

    <!-- 预览区域 -->
    <div v-if="previewData.length > 0" class="preview-section">
      <h4 class="preview-title">文件预览（前10行）</h4>
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
          <span v-else class="line-error">格式错误</span>
        </div>
      </div>
    </div>
    
    <!-- 上傳狀態顯示 -->
    <div v-if="props.uploadStatus" class="upload-status" :class="props.uploadStatus.type">
      <span class="status-icon">
        {{ props.uploadStatus.type === 'success' ? '✓' : '✗' }}
      </span>
      {{ props.uploadStatus.message }}
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCollapse } from '../composables/useCollapse'
import type { CodeTable, CodeTableFormat, ParseResult, UploadStatus } from '../types/index'
import { BuiltinCodeTableService } from '../services/builtinCodeTableService'

// 定义 props
interface Props {
  uploadStatus?: UploadStatus | null
}

const props = withDefaults(defineProps<Props>(), {
  uploadStatus: null
})

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand } = useCollapse()

// 暴露折叠方法给父组件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed
})

// 定义 emits
const emit = defineEmits<{
  uploadSuccess: [data: { codeTable: CodeTable; fileName: string; format: CodeTableFormat; tableKey?: string; isPrefix?: boolean }]
  uploadError: [error: string]
}>()

// 內置碼表相關
const builtinService = new BuiltinCodeTableService()
const selectedBuiltinTable = ref('')
const builtinTables = ref<Array<{key: string, name: string, description: string}>>([])

// 响应式数据
const selectedFormat = ref<CodeTableFormat>('char_first')
const selectedFile = ref<File | null>(null)
const isDragOver = ref(false)
const isUploading = ref(false)
const isPrefixCode = ref(false)
const fileInput = ref<HTMLInputElement>()
const previewData = ref<Array<{
  raw: string
  char: string
  code: string
  valid: boolean
}>>([])

// 文件大小格式化
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 触发文件选择
const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInput.value?.click()
  }
}

// 切换前缀码模式
const togglePrefixMode = () => {
  isPrefixCode.value = !isPrefixCode.value
}

// 处理拖拽
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

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    handleFileSelection(target.files[0])
  }
}

// 文件选择处理
const handleFileSelection = (file: File) => {
  // 检查文件类型
  if (!file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.csv')) {
    emit('uploadError', '请选择 .txt 或 .csv 格式的文件')
    return
  }

  // 检查文件大小（10MB限制）
  if (file.size > 10 * 1024 * 1024) {
    emit('uploadError', '文件大小不能超过 10MB')
    return
  }

  // 清除內置碼表選擇
  selectedBuiltinTable.value = ''
  
  selectedFile.value = file
  generatePreview(file)
}

// 生成文件预览
const generatePreview = async (file: File) => {
  try {
    const text = await readFileAsText(file)
    const lines = text.split('\n').slice(0, 10) // 只预览前10行
    
    previewData.value = lines.map(line => {
      const trimmed = line.trim()
      if (!trimmed) return { raw: line, char: '', code: '', valid: false }
      
      const parts = trimmed.split(/[\t\s]+/)
      if (parts.length < 2) return { raw: line, char: '', code: '', valid: false }
      
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
      
      return { raw: line, char, code, valid }
    })
  } catch (error) {
    console.error('生成预览失败:', error)
  }
}

// 移除文件
const removeFile = () => {
  selectedFile.value = null
  previewData.value = []
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
const parseCodeTable = (text: string, format: CodeTableFormat): ParseResult => {
  const codeTable: CodeTable = new Map()
  const lines = text.split('\n')
  let totalCodes = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const parts = trimmed.split(/[\t\s]+/)
    if (parts.length < 2) continue

    let char: string, code: string
    if (format === 'char_first') {
      char = parts[0].trim()
      code = parts[1].trim()
    } else {
      code = parts[0].trim()
      char = parts[1].trim()
    }

    // 檢查是否為單個Unicode字符（包括代理對）
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
    const result = parseCodeTable(text, selectedFormat.value)

    if (result.totalChars === 0) {
      emit('uploadError', '未找到有效的字符编码对，请检查文件格式')
      return
    }

    emit('uploadSuccess', {
      codeTable: result.codeTable,
      fileName: selectedFile.value.name,
      format: result.format,
      isPrefix: isPrefixCode.value
    })

  } catch (error) {
    emit('uploadError', `文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    isUploading.value = false
  }
}

// 載入內置碼表配置
async function loadBuiltinConfig() {
  try {
    await builtinService.loadConfig()
    builtinTables.value = builtinService.getAvailableTables()
  } catch (error) {
    console.error('載入內置碼表配置失敗:', error)
  }
}

// 處理內置碼表選擇變化
async function handleBuiltinTableChange() {
  // 當選擇內置碼表時，清除檔案選擇
  if (selectedBuiltinTable.value) {
    selectedFile.value = null
    previewData.value = []
    
    // 自動載入內置碼表
    await loadBuiltinTable()
  }
}

// 載入內置碼表
async function loadBuiltinTable() {
  if (!selectedBuiltinTable.value) return
  
  try {
    isUploading.value = true
    
    const result = await builtinService.downloadCodeTable(selectedBuiltinTable.value)
    
    emit('uploadSuccess', {
      codeTable: result.codeTable,
      fileName: `內置方案：${builtinTables.value.find(t => t.key === selectedBuiltinTable.value)?.name || selectedBuiltinTable.value}`,
      format: result.format,
      tableKey: selectedBuiltinTable.value,  // 添加tableKey用于前缀码检测
      isPrefix: isPrefixCode.value
    })
  } catch (error) {
    emit('uploadError', `載入內置碼表失敗: ${error instanceof Error ? error.message : String(error)}`)
  } finally {
    isUploading.value = false
  }
}

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
  margin-left: var(--spacing-lg);
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
  gap: var(--spacing-md);
}

/* 內置碼表選擇器樣式 */
.builtin-selector {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
}

.builtin-label {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.builtin-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.builtin-select {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  min-height: 44px;
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
  margin: var(--spacing-sm) 0;
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
  gap: var(--spacing-sm);
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
  padding: var(--spacing-sm);
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
  align-items: flex-start;
}

.prefix-button {
  background: #f3f4f6;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.prefix-button:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.prefix-button.active {
  background: #dcfce7;
  border-color: #16a34a;
  color: #15803d;
}

.prefix-button.active:hover {
  background: #bbf7d0;
  border-color: #15803d;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
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
  gap: var(--spacing-md);
}

/* 上传提示 */
.upload-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
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
  padding: var(--spacing-lg);
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
  margin-bottom: var(--spacing-xs);
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
  padding: var(--spacing-lg);
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
}

.preview-line {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border-primary);
}

.preview-line:last-child {
  border-bottom: none;
}

.preview-line.invalid {
  opacity: 0.6;
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
</style>
