<template>
  <div class="code-table-viewer card">
    <div class="card-header">
      <h3 class="card-title">碼表分析</h3>
      <p class="card-description">詳細分析碼表的基本信息。</p>
    </div>
    
    <div class="card-content">
    
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
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CodeTableAnalysis } from '../types/index'

interface Props {
  analysis: CodeTableAnalysis | null
}

const props = defineProps<Props>()
</script>

<style scoped>
.code-table-viewer {
  background: white;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

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
