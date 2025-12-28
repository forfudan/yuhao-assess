<template>
  <div ref="cardRef" class="code-table-viewer">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">碼表分析</h3>
          <p class="card-description">詳細分析碼表的基本信息。</p>
        </div>
        <div class="header-buttons">
          <button @click="exportCard" class="export-btn" :disabled="!analysis" title="导出图片">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
            </svg>
          </button>
          <button @click="toggleCollapsed" class="collapse-button">
            <svg :class="{ 'rotated': isCollapsed }" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    
    <div v-show="!isCollapsed" class="card-content">
    
    <div v-if="!analysis" class="no-data">
      <p>請先上傳或選擇碼表進行分析</p>
    </div>
    
    <div v-else class="analysis-content">
      <!-- 基本統計信息 -->
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">總字符數</div>
          <div class="stat-value">{{ analysis.totalChars.toLocaleString() }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">總編碼數</div>
          <div class="stat-value">{{ analysis.totalCodes.toLocaleString() }}</div>
        </div>
      </div>

      <!-- 前5個編碼信息 -->
      <div class="top-entries">
        <h4>前5個字符編碼</h4>
        <div class="entries-list">
          <div 
            v-for="(entry, index) in analysis.topEntries" 
            :key="index"
            class="entry-item"
          >
            <div class="entry-char">{{ entry.char }}</div>
            <div class="entry-codes">
              <span 
                v-for="code in entry.codes" 
                :key="code"
                class="entry-code"
              >
                {{ code }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 方案名稱標註 -->
        <div v-if="codeTableName" class="scheme-name-annotation">
          <span>當前方案：{{ codeTableName }}</span>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ExportService } from '../services/exportService'
import { useCollapse } from '../composables/useCollapse'
import type { CodeTableAnalysis } from '@/types/index'

interface Props {
  analysis: CodeTableAnalysis | null
  codeTableName?: string
  schemeName: string
}

const props = defineProps<Props>()

const cardRef = ref<HTMLElement>()
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

const exportCard = async () => {
  if (cardRef.value && props.analysis) {
    await ExportService.exportElementToPNG(cardRef.value, '碼表分析', props.schemeName, {
      copyToClipboard: ExportService.isClipboardSupported(),
    })
  }
}

// 暴露方法給父組件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})
</script>

<style scoped>
@import '../styles/card-common.css';

/* 原有样式 */
.viewer-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
}

.no-data {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
}

.analysis-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-lg);
}

.stat-item {
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  text-align: center;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
}

.top-entries h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.entry-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.entry-char {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
  min-width: 40px;
  text-align: center;
}

.entry-codes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.entry-code {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: white;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-sm);
  font-family: monospace;
  font-size: 0.875rem;
  color: var(--color-text-primary);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .cjk-grid {
    grid-template-columns: 1fr;
  }
  
  .entry-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .entry-char {
    min-width: auto;
  }
}
</style>
