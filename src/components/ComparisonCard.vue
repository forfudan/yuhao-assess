<template>
  <div class="comparison-card" v-bind="$attrs">
    <div class="card-header">
      <div class="header-content">
        <div class="header-text">
          <h3 class="card-title">方案對比</h3>
          <p class="card-description">對比不同輸入法方案的各項數據，支持內置方案和文件上傳。</p>
        </div>
        <button @click="toggleCollapsed" class="collapse-button">
          <svg :class="{ 'rotated': isCollapsed }" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-show="!isCollapsed" class="card-content">
      <div v-if="!hasAnyScheme" class="empty-state">
        <div class="empty-icon">📊</div>
        <h4>開始方案對比</h4>
        <p>添加多個輸入法方案進行對比分析</p>
        <button @click="showAddForm = true" class="primary-btn">添加第一個方案</button>
      </div>
      
      <div v-else>
        <!-- Tab 切換器 -->
        <div class="tabs-container">
          <div class="tab-list">
            <button 
              v-for="tab in tabs" 
              :key="tab.key"
              :class="['tab-button', { 'active': activeTab === tab.key }]"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- 對比表格 -->
        <div class="comparison-table-container">
          <table class="comparison-table">
            <thead>
              <tr>
                <th class="scheme-name-header sortable" @click="handleSort('name')">
                  <div class="header-content">
                    <span>方案名稱</span>
                    <span class="sort-arrow">{{ getSortArrow('name') }}</span>
                  </div>
                </th>
                
                <!-- 動態選重 Tab 的列 -->
                <template v-if="activeTab === 'dynamic'">
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRate')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>知乎動態選重率</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRate') }}</span>
                      </div>
                      <small>基於知乎字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRateSC')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>簡體動態選重率</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRateSC') }}</span>
                      </div>
                      <small>基於簡體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRateTC')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>繁體動態選重率</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRateTC') }}</span>
                      </div>
                      <small>基於繁體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('dynamicDupRateUnified')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>聯合動態選重率</span>
                        <span class="sort-arrow">{{ getSortArrow('dynamicDupRateUnified') }}</span>
                      </div>
                      <small>基於繁簡聯合字頻</small>
                    </div>
                  </th>
                </template>
                
                <!-- 靜態重碼 Tab 的列 -->
                <template v-else-if="activeTab === 'static'">
                  <th class="metric-header sortable" @click="handleSort('gb2312DuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>GB2312</span>
                        <span class="sort-arrow">{{ getSortArrow('gb2312DuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('guoziDuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>國字常用</span>
                        <span class="sort-arrow">{{ getSortArrow('guoziDuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkBasicDuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>CJK基本</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkBasicDuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToADuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-A</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToADuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToBDuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-B</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToBDuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToFDuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-F</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToFDuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToIDuplicateChars')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-I</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToIDuplicateChars') }}</span>
                      </div>
                      <small>重碼字數</small>
                    </div>
                  </th>
                </template>
                
                <!-- 最大候選 Tab 的列 -->
                <template v-else-if="activeTab === 'maxCandidates'">
                  <th class="metric-header sortable" @click="handleSort('gb2312MaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>GB2312</span>
                        <span class="sort-arrow">{{ getSortArrow('gb2312MaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('guoziMaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>國字常用</span>
                        <span class="sort-arrow">{{ getSortArrow('guoziMaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkBasicMaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>CJK基本</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkBasicMaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToAMaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-A</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToAMaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToBMaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-B</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToBMaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToFMaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-F</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToFMaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('cjkToIMaxCount')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>到CJK-I</span>
                        <span class="sort-arrow">{{ getSortArrow('cjkToIMaxCount') }}</span>
                      </div>
                      <small>最大候選數</small>
                    </div>
                  </th>
                </template>
                
                <!-- 速度當量 Tab 的列 -->
                <template v-else-if="activeTab === 'speedEquiv'">
                  <th class="metric-header sortable" @click="handleSort('zhihuEquiv')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>知乎速度當量</span>
                        <span class="sort-arrow">{{ getSortArrow('zhihuEquiv') }}</span>
                      </div>
                      <small>基於知乎字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('scEquiv')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>簡體速度當量</span>
                        <span class="sort-arrow">{{ getSortArrow('scEquiv') }}</span>
                      </div>
                      <small>基於簡體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('tcEquiv')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>繁體速度當量</span>
                        <span class="sort-arrow">{{ getSortArrow('tcEquiv') }}</span>
                      </div>
                      <small>基於繁體字頻</small>
                    </div>
                  </th>
                  <th class="metric-header sortable" @click="handleSort('unifiedEquiv')">
                    <div class="metric-header-content">
                      <div class="header-title">
                        <span>聯合速度當量</span>
                        <span class="sort-arrow">{{ getSortArrow('unifiedEquiv') }}</span>
                      </div>
                      <small>基於繁簡聯合字頻</small>
                    </div>
                  </th>
                </template>
                <th class="actions-header">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(scheme, index) in allSchemes" :key="scheme.id" class="scheme-row">
                <td class="scheme-name">
                  <div class="scheme-info">
                    <span class="scheme-title">{{ scheme.name }}</span>
                    <span v-if="scheme.isBuiltin" class="scheme-source">內置方案</span>
                    <span v-else class="scheme-source">上傳方案</span>
                  </div>
                </td>
                
                <!-- 動態選重 Tab 的數據列 -->
                <template v-if="activeTab === 'dynamic'">
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamic?.dynamicDupRate) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamic?.dynamicDupRateSC) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamic?.dynamicDupRateTC) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatRate(scheme.data?.dynamic?.dynamicDupRateUnified) }}
                    </span>
                  </td>
                </template>
                
                <!-- 靜態重碼 Tab 的數據列 -->
                <template v-else-if="activeTab === 'static'">
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.gb2312DuplicateChars) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.guoziDuplicateChars) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.cjkBasicDuplicateChars) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.cjkToADuplicateChars) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.cjkToBDuplicateChars) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.cjkToFDuplicateChars) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.static?.cjkToIDuplicateChars) }}
                    </span>
                  </td>
                </template>
                
                <!-- 最大候選 Tab 的數據列 -->
                <template v-else-if="activeTab === 'maxCandidates'">
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.gb2312MaxCount) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.guoziMaxCount) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.cjkBasicMaxCount) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.cjkToAMaxCount) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.cjkToBMaxCount) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.cjkToFMaxCount) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatNumber(scheme.data?.maxCandidates?.cjkToIMaxCount) }}
                    </span>
                  </td>
                </template>
                
                <!-- 速度當量 Tab 的數據列 -->
                <template v-else-if="activeTab === 'speedEquiv'">
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatEquiv(scheme.data?.speedEquiv?.zhihuEquiv) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatEquiv(scheme.data?.speedEquiv?.scEquiv) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatEquiv(scheme.data?.speedEquiv?.tcEquiv) }}
                    </span>
                  </td>
                  <td class="metric-cell">
                    <div v-if="scheme.isCalculating" class="calculating">
                      <div class="mini-spinner"></div>
                      <span>計算中</span>
                    </div>
                    <span v-else class="metric-value">
                      {{ formatEquiv(scheme.data?.speedEquiv?.unifiedEquiv) }}
                    </span>
                  </td>
                </template>
                <td class="actions-cell">
                  <button 
                    v-if="canRemoveScheme(scheme)" 
                    @click="removeScheme(scheme)" 
                    class="remove-btn"
                    title="移除此方案"
                  >
                    🗑️
                  </button>
                  <span v-else class="no-remove">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 添加方案按鈕 -->
        <div class="add-scheme-section">
          <button 
            @click="showAddForm = true" 
            class="add-scheme-btn"
            :disabled="isAdding"
          >
            <span v-if="isAdding">添加中...</span>
            <span v-else>➕ 添加新方案</span>
          </button>
          
          <!-- 清除所有方案按鈕 -->
          <button 
            v-if="additionalSchemes.length > 0"
            @click="clearAllSchemes" 
            class="clear-all-btn"
            title="清除所有額外添加的方案"
          >
            🗑️ 清除全部
          </button>
          
          <!-- 重新計算按鈕 -->
          <button 
            @click="recalculateCurrentTab"
            :disabled="isRecalculating"
            class="recalculate-btn"
            title="重新計算所有方案的當前Tab數據"
          >
            <span v-if="isRecalculating">🔄 計算中...</span>
            <span v-else>🔄 重新計算</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 添加方案表單 - 使用 Teleport 確保浮在最上層 -->
  <Teleport to="body">
    <div v-if="showAddForm" class="add-form-overlay">
      <div class="add-form">
        <div class="form-header">
          <h4>添加對比方案</h4>
          <button @click="cancelAdd" class="close-btn">✕</button>
        </div>
        
        <div class="form-content">
          <!-- 內置方案選項 -->
          <div class="form-section">
            <h5>內置方案</h5>
            <p class="section-desc">選擇預設的輸入法方案</p>
            <div class="builtin-options">
              <select v-model="selectedBuiltinScheme" @change="onBuiltinSchemeSelect" class="scheme-select">
                <option value="">請選擇內置方案</option>
                <option v-for="scheme in availableBuiltinSchemes" :key="scheme.id" :value="scheme.id">
                  {{ scheme.name }}
                </option>
              </select>
              <button 
                @click="addAllBuiltinSchemes" 
                :disabled="isAdding || availableBuiltinSchemes.length === 0"
                class="add-all-btn"
              >
                選擇所有
              </button>
            </div>
          </div>

          <div class="form-divider">
            <span>或</span>
          </div>

          <!-- 文件上傳選項 -->
          <div class="form-section">
            <h5>上傳碼表文件</h5>
            <p class="section-desc">選擇碼表格式並上傳 .txt 或 .csv 文件</p>
            
            <!-- 前綴碼選項 -->
            <div class="prefix-toggle-section">
              <label class="prefix-toggle">
                <input 
                  type="checkbox" 
                  v-model="uploadPrefixFlag"
                  class="prefix-checkbox"
                >
                <span class="prefix-label">前綴碼方案</span>
                <span class="prefix-desc">（勾選表示這是前綴碼方案，影響空格鍵頻率計算）</span>
              </label>
            </div>
            
            <div class="upload-area">
              <input 
                ref="fileInputCharCode"
                type="file" 
                @change="(e) => handleFileUpload(e, 'char_first')" 
                accept=".txt,.csv"
                class="file-input"
                :disabled="isAdding"
                style="display: none;"
              >
              <input 
                ref="fileInputCodeChar"
                type="file" 
                @change="(e) => handleFileUpload(e, 'code_first')" 
                accept=".txt,.csv"
                class="file-input"
                :disabled="isAdding"
                style="display: none;"
              >
              <button 
                @click="triggerFileUpload('char_first')" 
                class="upload-btn"
                :disabled="isAdding"
              >
                漢字-編碼格式
              </button>
              <button 
                @click="triggerFileUpload('code_first')" 
                class="upload-btn"
                :disabled="isAdding"
              >
                編碼-漢字格式
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// 禁用自動屬性繼承，因為我們有多個根節點（包括 Teleport）
defineOptions({
  inheritAttrs: false
})

import { ref, computed, onMounted, watch, Teleport } from 'vue'
import { generateCharset, type CharsetType, getTheoreticalCharsetSize } from '../services/charsetService'
import { getDynamicDupRate } from '../services/duplicateAnalysisService'
import { BuiltinCodeTableService } from '../services/builtinCodeTableService'
import { codeTableProcessingService } from '../services/codeTableProcessingService'
import { 
  formatRate, 
  formatNumber, 
  formatEquiv
} from '../services/uiService'
import { 
  loadCharFrequency,
  loadCharFrequencySC,
  loadCharFrequencyTC,
  loadCharFrequencyUnified,
  loadAllCharFrequencies
} from '../services/dataService'
import {
  calculateSpeedEquivFromCodeTable,
  calculateCodePairFrequencies
} from '../services/speedAnalysisService'
import {
  getAllMaximumCandidates,
  type MaximumCandidatesResult
} from '../services/maximumCandidatesService'
import { useCollapse } from '../composables/useCollapse'
import type { CodeTable, CharFrequency } from '../types'

// Props
interface Props {
  currentCodeTable?: CodeTable | null
  currentCodeTableName?: string
}

const props = defineProps<Props>()

// 折叠功能
const { isCollapsed, toggleCollapsed, collapse, expand, getCollapsedState } = useCollapse()

// 暴露摺疊方法給父組件
defineExpose({
  collapse,
  expand,
  toggle: toggleCollapsed,
  getCollapsedState
})

// 定義方案數據接口
interface DynamicData {
  dynamicDupRate: number
  dynamicDupRateSC: number
  dynamicDupRateTC: number
  dynamicDupRateUnified: number
}

interface StaticData {
  gb2312DuplicateChars: number
  guoziDuplicateChars: number
  cjkBasicDuplicateChars: number
  cjkToADuplicateChars: number
  cjkToBDuplicateChars: number
  cjkToFDuplicateChars: number
  cjkToIDuplicateChars: number
}

interface SpeedEquivData {
  zhihuEquiv: number
  scEquiv: number
  tcEquiv: number
  unifiedEquiv: number
}

interface MaxCandidatesData {
  gb2312MaxCount: number
  guoziMaxCount: number
  cjkBasicMaxCount: number
  cjkToAMaxCount: number
  cjkToBMaxCount: number
  cjkToFMaxCount: number
  cjkToIMaxCount: number
}

interface SchemeData {
  dynamic?: DynamicData
  static?: StaticData
  maxCandidates?: MaxCandidatesData
  speedEquiv?: SpeedEquivData
}

// 定義方案接口
interface Scheme {
  id: string
  name: string
  codeTable?: CodeTable
  isBuiltin: boolean
  isCalculating: boolean
  isPrefix: boolean
  data?: SchemeData
  // 元數據字段
  source?: string // 來源（文件名或內置方案ID）
  uploadedAt?: Date // 上傳時間
}

// 定義內置方案接口
interface BuiltinScheme {
  id: string
  name: string
}

// 響應式數據
const yuhaoDefaultScheme = ref<Scheme | null>(null) // 宇浩日月方案
const currentUserScheme = ref<Scheme | null>(null) // 當前用戶方案
const additionalSchemes = ref<Scheme[]>([]) // 額外添加的方案
const showAddForm = ref(false)
const isAdding = ref(false)
const isRecalculating = ref(false) // 重新計算狀態
const selectedBuiltinScheme = ref('')
const availableBuiltinSchemes = ref<BuiltinScheme[]>([])
const fileInputCharCode = ref<HTMLInputElement>()
const fileInputCodeChar = ref<HTMLInputElement>()
const uploadPrefixFlag = ref(false) // 用户上传文件时的前缀码标志

// Tab 相關狀態
const activeTab = ref<'dynamic' | 'static' | 'maxCandidates' | 'speedEquiv'>('dynamic')
const tabs = [
  { key: 'dynamic', label: '動態選重' },
  { key: 'static', label: '靜態重碼' },
  { key: 'maxCandidates', label: '最大候選' },
  { key: 'speedEquiv', label: '速度當量' }
] as const

// 排序相關狀態
type SortDirection = 'desc' | 'asc' | 'none'
type DataSortColumn = 'dynamicDupRate' | 'dynamicDupRateSC' | 'dynamicDupRateTC' | 'dynamicDupRateUnified' | 
                      'gb2312DuplicateChars' | 'guoziDuplicateChars' | 'cjkBasicDuplicateChars' | 
                      'cjkToADuplicateChars' | 'cjkToBDuplicateChars' | 'cjkToFDuplicateChars' | 'cjkToIDuplicateChars' |
                      'gb2312MaxCount' | 'guoziMaxCount' | 'cjkBasicMaxCount' | 
                      'cjkToAMaxCount' | 'cjkToBMaxCount' | 'cjkToFMaxCount' | 'cjkToIMaxCount' |
                      'zhihuEquiv' | 'scEquiv' | 'tcEquiv' | 'unifiedEquiv'
type SortColumn = 'name' | DataSortColumn

const sortColumn = ref<SortColumn | null>(null)
const sortDirection = ref<SortDirection>('none')

// 創建服務實例
const builtinService = new BuiltinCodeTableService()

// 本地存儲鍵名
const COMPARISON_STORAGE_KEY = 'yuhao-comparison-schemes'

// 保存方案數據到本地存儲
const saveComparisonData = () => {
  try {
    const dataToSave = {
      additionalSchemes: additionalSchemes.value.map(scheme => ({
        id: scheme.id,
        name: scheme.name,
        isBuiltin: scheme.isBuiltin,
        isPrefix: scheme.isPrefix, // 保存前綴碼設置
        data: scheme.data,
        codeTableSize: scheme.codeTable?.size || 0,
        // 保存內置方案的 key 用於重新載入
        builtinKey: scheme.isBuiltin ? scheme.id.split('_')[1] : undefined,
        // 保存新增的元數據
        source: scheme.source,
        uploadedAt: scheme.uploadedAt
      }))
    }
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(dataToSave))
  } catch (error) {
    console.error('保存對比數據失敗:', error)
  }
}

// 從本地存儲載入方案數據
const loadComparisonData = async () => {
  try {
    const savedData = localStorage.getItem(COMPARISON_STORAGE_KEY)
    if (!savedData) return

    const data = JSON.parse(savedData)
    
    // 恢復額外方案
    if (data.additionalSchemes && Array.isArray(data.additionalSchemes)) {
      for (const savedScheme of data.additionalSchemes) {
        try {
          let codeTable: CodeTable | undefined
          let correctIsPrefix = savedScheme.isPrefix || false // 默認從保存的數據中獲取
          
          if (savedScheme.isBuiltin && savedScheme.builtinKey) {
            // 重新載入內置方案
            const result = await builtinService.downloadCodeTable(savedScheme.builtinKey)
            codeTable = result.codeTable
            
            // 重新獲取內置方案的正確前綴碼設置
            const schemeConfig = await builtinService.getBuiltinCodeTable(savedScheme.builtinKey)
            correctIsPrefix = schemeConfig?.prefix || false
            console.log(`[調試] 恢復內置方案 ${savedScheme.name}:`, {
              builtinKey: savedScheme.builtinKey,
              savedIsPrefix: savedScheme.isPrefix,
              configPrefix: schemeConfig?.prefix,
              finalIsPrefix: correctIsPrefix
            })
          } else {
            console.log(`恢復上傳方案 ${savedScheme.name}:`, {
              savedIsPrefix: savedScheme.isPrefix,
              finalIsPrefix: correctIsPrefix
            })
          }
          
          // 創建恢復的方案對象
          const restoredScheme: Scheme = {
            id: savedScheme.id,
            name: savedScheme.name,
            isBuiltin: savedScheme.isBuiltin,
            isCalculating: false,
            isPrefix: correctIsPrefix, // 使用正確的前綴碼設置
            data: savedScheme.data,
            codeTable,
            source: savedScheme.source,
            uploadedAt: savedScheme.uploadedAt ? new Date(savedScheme.uploadedAt) : undefined
          }
          
          additionalSchemes.value.push(restoredScheme)
        } catch (error) {
          console.error(`恢復方案 ${savedScheme.name} 失敗:`, error)
        }
      }
    }
  } catch (error) {
    console.error('載入對比數據失敗:', error)
  }
}

// 清理本地存儲數據
const clearComparisonData = () => {
  localStorage.removeItem(COMPARISON_STORAGE_KEY)
}

// 計算屬性 - 合併所有方案用於顯示
const allSchemes = computed(() => {
  const schemes = []
  if (currentUserScheme.value) schemes.push(currentUserScheme.value)
  schemes.push(...additionalSchemes.value)
  
  // 如果沒有排序，直接返回
  if (!sortColumn.value || sortDirection.value === 'none') {
    return schemes
  }
  
  // 進行排序
  return [...schemes].sort((a, b) => {
    let aValue: any
    let bValue: any
    
    if (sortColumn.value === 'name') {
      aValue = a.name
      bValue = b.name
    } else if (sortColumn.value) {
      // TypeScript類型保護：確保sortColumn.value是數據列而不是'name'
      const column = sortColumn.value as DataSortColumn
      
      // 根據列名判斷是動態還是靜態數據
      if (['dynamicDupRate', 'dynamicDupRateSC', 'dynamicDupRateTC', 'dynamicDupRateUnified'].includes(column)) {
        aValue = a.data?.dynamic?.[column as keyof DynamicData] ?? 0
        bValue = b.data?.dynamic?.[column as keyof DynamicData] ?? 0
      } else if (['gb2312MaxCount', 'guoziMaxCount', 'cjkBasicMaxCount', 'cjkToAMaxCount', 'cjkToBMaxCount', 'cjkToFMaxCount', 'cjkToIMaxCount'].includes(column)) {
        aValue = a.data?.maxCandidates?.[column as keyof MaxCandidatesData] ?? 0
        bValue = b.data?.maxCandidates?.[column as keyof MaxCandidatesData] ?? 0
      } else if (['zhihuEquiv', 'scEquiv', 'tcEquiv', 'unifiedEquiv'].includes(column)) {
        aValue = a.data?.speedEquiv?.[column as keyof SpeedEquivData] ?? 0
        bValue = b.data?.speedEquiv?.[column as keyof SpeedEquivData] ?? 0
      } else {
        aValue = a.data?.static?.[column as keyof StaticData] ?? 0
        bValue = b.data?.static?.[column as keyof StaticData] ?? 0
      }
    } else {
      aValue = 0
      bValue = 0
    }
    
    // 字符串排序
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue)
      return sortDirection.value === 'asc' ? comparison : -comparison
    }
    
    // 數值排序
    const comparison = aValue - bValue
    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

// 計算屬性 - 是否有任何方案
const hasAnyScheme = computed(() => allSchemes.value.length > 0)

// 確保當前 Tab 的數據已加載
const ensureCurrentTabDataLoaded = async () => {
  const schemes = allSchemes.value
  const pendingCalculations: Promise<void>[] = []
  
  for (const scheme of schemes) {
    if (!scheme.codeTable || scheme.isCalculating) continue
    
    let needsCalculation = false
    if (activeTab.value === 'dynamic') {
      needsCalculation = !scheme.data?.dynamic
    } else if (activeTab.value === 'static') {
      needsCalculation = !scheme.data?.static
    } else if (activeTab.value === 'maxCandidates') {
      needsCalculation = !scheme.data?.maxCandidates
    } else if (activeTab.value === 'speedEquiv') {
      needsCalculation = !scheme.data?.speedEquiv
    }
    
    if (needsCalculation) {
      pendingCalculations.push(calculateMissingData(scheme))
    }
  }
  
  await Promise.all(pendingCalculations)
}

// 為方案計算缺失的數據
const calculateMissingData = async (scheme: Scheme) => {
  if (!scheme.codeTable || scheme.isCalculating) return
  
  scheme.isCalculating = true
  
  try {
    if (!scheme.data) {
      scheme.data = {}
    }
    
    // 檢查是否為主方案（不可刪除的方案）
    const isMainScheme = currentUserScheme.value && scheme.id === currentUserScheme.value.id
    
    if (activeTab.value === 'dynamic' && !scheme.data.dynamic) {
      scheme.data.dynamic = await calculateDynamicData(scheme.codeTable, scheme.isPrefix)
    } else if (activeTab.value === 'static' && !scheme.data.static) {
      scheme.data.static = await calculateStaticData(scheme.codeTable, scheme.isPrefix)
    } else if (activeTab.value === 'maxCandidates' && !scheme.data.maxCandidates) {
      scheme.data.maxCandidates = await calculateMaxCandidatesData(scheme.codeTable, scheme.isPrefix)
    } else if (activeTab.value === 'speedEquiv' && !scheme.data.speedEquiv) {
      if (isMainScheme) {
        // 主方案使用全局已處理的碼表
        scheme.data.speedEquiv = await calculateMainSchemeSpeedEquivData()
      } else {
        // 新增方案使用獨立計算
        scheme.data.speedEquiv = await calculateSpeedEquivData(scheme.codeTable, scheme.isPrefix)
      }
    }
  } catch (error) {
    console.error(`計算方案 ${scheme.name} 的數據失敗:`, error)
  } finally {
    scheme.isCalculating = false
  }
}

// 重新計算當前Tab所有方案的數據
const recalculateCurrentTab = async () => {
  isRecalculating.value = true
  try {
    // 獲取所有有效的方案（有碼表且不在計算中）
    const validSchemes = allSchemes.value.filter(scheme => 
      scheme.codeTable && !scheme.isCalculating
    )
    
    // 清除所有方案當前Tab的數據並重新計算
    for (const scheme of validSchemes) {
      if (scheme.data) {
        if (activeTab.value === 'dynamic') {
          delete scheme.data.dynamic
        } else if (activeTab.value === 'static') {
          delete scheme.data.static
        } else if (activeTab.value === 'maxCandidates') {
          delete scheme.data.maxCandidates
        } else if (activeTab.value === 'speedEquiv') {
          delete scheme.data.speedEquiv
        }
      }
      console.log(`[調試] 重新計算方案 ${scheme.name}:`, {
        isPrefix: scheme.isPrefix,
        isBuiltin: scheme.isBuiltin,
        source: scheme.source,
        activeTab: activeTab.value
      })
      await calculateMissingData(scheme)
    }
    
    // 保存數據
    saveComparisonData()
  } catch (error) {
    console.error('重新計算失敗:', error)
  } finally {
    isRecalculating.value = false
  }
}

// 惰性計算：監聽 Tab 切換
watch(activeTab, async (newTab) => {
  await ensureCurrentTabDataLoaded()
}, { immediate: true })

// 排序函數
const handleSort = (column: SortColumn) => {
  if (sortColumn.value === column) {
    // 循環切換排序方向：升序 -> 降序 -> 無排序 -> 升序
    switch (sortDirection.value) {
      case 'asc':
        sortDirection.value = 'desc'
        break
      case 'desc':
        sortDirection.value = 'none'
        sortColumn.value = null
        break
      case 'none':
        sortDirection.value = 'asc'
        break
    }
  } else {
    // 新列，從升序開始
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

// 獲取排序箭頭
const getSortArrow = (column: SortColumn) => {
  if (sortColumn.value !== column || sortDirection.value === 'none') {
    return '⇅'
  }
  return sortDirection.value === 'desc' ? '↓' : '↑'
}

// 計算字符集的重碼字符數
async function calculateCharsetDuplicates(charsetType: CharsetType, allChars: Set<string>, fullCodeTable: CodeTable) {
  const actualCharset = await generateCharset(charsetType, allChars)
  
  const fullCodeToChars = new Map<string, string[]>()
  
  for (const char of actualCharset) {
    const codes = fullCodeTable.get(char)
    if (codes && codes.length > 0) {
      const code = codes[0]
      if (!fullCodeToChars.has(code)) {
        fullCodeToChars.set(code, [])
      }
      fullCodeToChars.get(code)!.push(char)
    }
  }
  
  let fullDuplicateChars = 0
  for (const chars of fullCodeToChars.values()) {
    if (chars.length > 1) {
      fullDuplicateChars += chars.length
    }
  }
  
  return fullDuplicateChars
}

// 初始化內置方案列表
onMounted(async () => {
  try {
    const config = await builtinService.loadConfig()
    availableBuiltinSchemes.value = config.builtinCodeTables.map(table => ({
      id: table.key,  // 使用 key 而不是 id
      name: table.name
    }))
    
    // 載入保存的對比數據
    await loadComparisonData()
    
    // 如果用戶有當前方案，也載入它
    if (props.currentCodeTable) {
      loadCurrentUserScheme()
    }
  } catch (error) {
    console.error('載入內置方案列表失敗:', error)
  }
})

// 監聽當前方案變化
watch(() => [props.currentCodeTable, props.currentCodeTableName], ([newCodeTable, newCodeTableName]) => {
  if (newCodeTable) {
    loadCurrentUserScheme()
  } else {
    currentUserScheme.value = null
  }
})

// 監聽方案數據變化並自動保存
watch([additionalSchemes], () => {
  // 延遲保存以避免頻繁寫入
  setTimeout(() => {
    saveComparisonData()
  }, 500)
}, { deep: true })

// 載入當前用戶方案
const loadCurrentUserScheme = async () => {
  if (props.currentCodeTable) {
    // 使用實際的方案名稱，如果沒有則使用默認名稱
    const schemeName = props.currentCodeTableName || '用戶方案'
    
    // 獲取全局的前綴碼信息
    const processingOptions = codeTableProcessingService.getProcessingOptions()
    const globalIsPrefix = processingOptions?.isPrefix || false
    
    currentUserScheme.value = {
      id: `current-${Date.now()}`,
      name: schemeName,
      codeTable: props.currentCodeTable,
      isBuiltin: false,
      isCalculating: true,
      isPrefix: globalIsPrefix,  // 使用全局的前綴碼設置
      data: undefined
    }
    // 異步計算數據
    try {
      const data = await calculateSchemeData(props.currentCodeTable, globalIsPrefix)
      currentUserScheme.value.data = data
      currentUserScheme.value.isCalculating = false
    } catch (error) {
      console.error('Failed to calculate current scheme data:', error)
      currentUserScheme.value.isCalculating = false
    }
  }
}

// 計算方案數據
async function calculateDynamicData(codeTable: CodeTable, isPrefix = false): Promise<DynamicData> {
  // 為對比方案獨立處理碼表，不使用單例服務以避免干擾當前方案
  const { generateFullCodeTable } = await import('../services/codeTableCleanService')
  const fullResult = generateFullCodeTable(codeTable)
  const fullCodeTable = fullResult.codeTable
  
  // 加載所有字頻數據
  const [charFrequency, charFrequencySC, charFrequencyTC, charFrequencyUnified] = await Promise.all([
    loadCharFrequency(),
    loadCharFrequencySC(),
    loadCharFrequencyTC(),
    loadCharFrequencyUnified()
  ])
  
  // 計算各種動態選重率（只計算全碼）
  const dynamicDupRate = getDynamicDupRate(fullCodeTable, charFrequency)
  const dynamicDupRateSC = getDynamicDupRate(fullCodeTable, charFrequencySC)
  const dynamicDupRateTC = getDynamicDupRate(fullCodeTable, charFrequencyTC)
  const dynamicDupRateUnified = getDynamicDupRate(fullCodeTable, charFrequencyUnified)
  
  return {
    dynamicDupRate,
    dynamicDupRateSC,
    dynamicDupRateTC,
    dynamicDupRateUnified
  }
}

// 計算靜態重碼數據（對比方案用）
async function calculateStaticData(codeTable: CodeTable, isPrefix = false): Promise<StaticData> {
  console.time('靜態重碼計算')
  
  // 從碼表鍵中提取所有單個字符（只做一次）
  const allUniqueChars = new Set<string>()
  for (const key of codeTable.keys()) {
    for (const char of key) {
      allUniqueChars.add(char)
    }
  }

  // 為對比方案獨立處理碼表，不使用單例服務以避免干擾當前方案（只做一次）
  const { generateFullCodeTable } = await import('../services/codeTableCleanService')
  const fullResult = generateFullCodeTable(codeTable)
  const fullCodeTable = fullResult.codeTable
  
  // 預先生成所有需要的字符集（並行處理）
  const charsetTypes: CharsetType[] = [
    'gb2312', 'guozi', 'cjk_basic', 'cjk_to_a', 'cjk_to_b', 'cjk_to_f', 'cjk_to_i'
  ]
  
  console.time('生成字符集')
  const charsetPromises = charsetTypes.map(async (type) => {
    const charset = await generateCharset(type, allUniqueChars)
    return { type, charset }
  })
  const charsetResults = await Promise.all(charsetPromises)
  console.timeEnd('生成字符集')
  
  // 建立字符集映射
  const charsetMap = new Map<CharsetType, Set<string>>()
  charsetResults.forEach(({ type, charset }) => {
    charsetMap.set(type, charset)
  })
  
  // 優化的重碼計算函數
  const calculateCharsetDuplicatesOptimized = (charset: Set<string>) => {
    const fullCodeToChars = new Map<string, string[]>()
    
    for (const char of charset) {
      const codes = fullCodeTable.get(char)
      if (codes && codes.length > 0) {
        const code = codes[0]
        if (!fullCodeToChars.has(code)) {
          fullCodeToChars.set(code, [])
        }
        fullCodeToChars.get(code)!.push(char)
      }
    }
    
    let fullDuplicateChars = 0
    for (const chars of fullCodeToChars.values()) {
      if (chars.length > 1) {
        fullDuplicateChars += chars.length
      }
    }
    
    return fullDuplicateChars
  }
  
  // 並行計算各字符集的重碼統計
  console.time('計算各字符集重碼')
  const results = {
    gb2312DuplicateChars: calculateCharsetDuplicatesOptimized(charsetMap.get('gb2312')!),
    guoziDuplicateChars: calculateCharsetDuplicatesOptimized(charsetMap.get('guozi')!),
    cjkBasicDuplicateChars: calculateCharsetDuplicatesOptimized(charsetMap.get('cjk_basic')!),
    cjkToADuplicateChars: calculateCharsetDuplicatesOptimized(charsetMap.get('cjk_to_a')!),
    cjkToBDuplicateChars: calculateCharsetDuplicatesOptimized(charsetMap.get('cjk_to_b')!),
    cjkToFDuplicateChars: calculateCharsetDuplicatesOptimized(charsetMap.get('cjk_to_f')!),
    cjkToIDuplicateChars: calculateCharsetDuplicatesOptimized(charsetMap.get('cjk_to_i')!)
  }
  console.timeEnd('計算各字符集重碼')
  
  console.timeEnd('靜態重碼計算')
  return results
}

// 計算最大候選項數據（對比方案用）- 優化版本
async function calculateMaxCandidatesData(codeTable: CodeTable, isPrefix = false): Promise<MaxCandidatesData> {
  try {
    console.time('最大候選計算')
    
    // 從碼表鍵中提取所有單個字符（只做一次）
    const allUniqueChars = new Set<string>()
    for (const key of codeTable.keys()) {
      for (const char of key) {
        allUniqueChars.add(char)
      }
    }

    // 生成全碼表（只做一次）
    const { generateFullCodeTable } = await import('../services/codeTableCleanService')
    const fullResult = generateFullCodeTable(codeTable)
    const fullCodeTable = fullResult.codeTable
    
    // 預先生成所有需要的字符集（並行處理）
    const charsetTypes: CharsetType[] = [
      'gb2312', 'guozi', 'cjk_basic', 'cjk_to_a', 'cjk_to_b', 'cjk_to_f', 'cjk_to_i'
    ]
    
    console.time('生成字符集')
    const charsetPromises = charsetTypes.map(async (type) => {
      const charset = await generateCharset(type, allUniqueChars)
      return { type, charset }
    })
    const charsetResults = await Promise.all(charsetPromises)
    console.timeEnd('生成字符集')
    
    // 建立字符集映射
    const charsetMap = new Map<CharsetType, Set<string>>()
    charsetResults.forEach(({ type, charset }) => {
      charsetMap.set(type, charset)
    })
    
    // 預先計算所有編碼到字符的映射（只做一次）
    console.time('建立編碼映射')
    const allCodeToChars = new Map<string, string[]>()
    for (const [char, codes] of fullCodeTable.entries()) {
      if (codes && codes.length > 0) {
        const code = codes[0] // 使用第一個編碼（全碼）
        if (!allCodeToChars.has(code)) {
          allCodeToChars.set(code, [])
        }
        allCodeToChars.get(code)!.push(char)
      }
    }
    console.timeEnd('建立編碼映射')
    
    // 為每個字符集計算最大候選項（重用預處理的數據）
    console.time('計算各字符集最大候選')
    const calculateMaxForCharset = (charset: Set<string>) => {
      const codeToChars = new Map<string, string[]>()
      
      // 只處理當前字符集中的字符
      for (const char of charset) {
        const codes = fullCodeTable.get(char)
        if (codes && codes.length > 0) {
          const code = codes[0]
          if (!codeToChars.has(code)) {
            codeToChars.set(code, [])
          }
          codeToChars.get(code)!.push(char)
        }
      }
      
      // 找出最大候選項個數
      let maxCount = 0
      for (const chars of codeToChars.values()) {
        if (chars.length > maxCount) {
          maxCount = chars.length
        }
      }
      
      return maxCount
    }
    
    const results = {
      gb2312MaxCount: calculateMaxForCharset(charsetMap.get('gb2312')!),
      guoziMaxCount: calculateMaxForCharset(charsetMap.get('guozi')!),
      cjkBasicMaxCount: calculateMaxForCharset(charsetMap.get('cjk_basic')!),
      cjkToAMaxCount: calculateMaxForCharset(charsetMap.get('cjk_to_a')!),
      cjkToBMaxCount: calculateMaxForCharset(charsetMap.get('cjk_to_b')!),
      cjkToFMaxCount: calculateMaxForCharset(charsetMap.get('cjk_to_f')!),
      cjkToIMaxCount: calculateMaxForCharset(charsetMap.get('cjk_to_i')!)
    }
    console.timeEnd('計算各字符集最大候選')
    
    console.timeEnd('最大候選計算')
    return results
  } catch (error) {
    console.error('計算最大候選項數據失敗:', error)
    return {
      gb2312MaxCount: 0,
      guoziMaxCount: 0,
      cjkBasicMaxCount: 0,
      cjkToAMaxCount: 0,
      cjkToBMaxCount: 0,
      cjkToFMaxCount: 0,
      cjkToIMaxCount: 0
    }
  }
}

// 計算速度當量數據（對比方案用）
async function calculateSpeedEquivData(codeTable: CodeTable, isPrefix = false): Promise<SpeedEquivData> {
  try {
    // 獨立處理碼表，不使用全局單例服務
    const { generateFullCodeTable } = await import('../services/codeTableCleanService')
    const fullResult = generateFullCodeTable(codeTable)
    const fullCodeTable = fullResult.codeTable
    
    // 計算最大碼長
    let maxLength = 0
    for (const [, codes] of codeTable.entries()) {
      for (const code of codes) {
        maxLength = Math.max(maxLength, code.length)
      }
    }
    maxLength = maxLength || 4
    
    // 生成加選重鍵的碼表
    const processedCodeTable = generateCodeTableWithSelection(fullCodeTable, maxLength, isPrefix)
    
    // 加載當量表
    const response = await fetch('/data/equivTable.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const equivTableData = await response.json()
    const equivTable = equivTableData.data || {}
    
    // 加載各種字頻表
    const builtinService = new BuiltinCodeTableService()
    const [zhihuFreq, scFreq, tcFreq, unifiedFreq] = await Promise.all([
      builtinService.loadCharFrequency(),
      builtinService.loadCharFrequencySC(),
      builtinService.loadCharFrequencyTC(),
      builtinService.loadCharFrequencyUnified()
    ])
    
    // 計算各種字頻下的速度當量
    const zhihuEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, zhihuFreq, equivTable)
    const scEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, scFreq, equivTable)
    const tcEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, tcFreq, equivTable)
    const unifiedEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, unifiedFreq, equivTable)
    
    return {
      zhihuEquiv,
      scEquiv,
      tcEquiv,
      unifiedEquiv
    }
  } catch (error) {
    console.error('速度當量計算失敗:', error)
    return {
      zhihuEquiv: 0,
      scEquiv: 0,
      tcEquiv: 0,
      unifiedEquiv: 0
    }
  }
}

// 計算主方案速度當量數據（使用全局已處理的碼表）
async function calculateMainSchemeSpeedEquivData(): Promise<SpeedEquivData> {
  try {
    // 使用全局已處理的碼表
    const processedTables = codeTableProcessingService.getProcessedTables()
    if (!processedTables) {
      throw new Error('無法獲取已處理的碼表')
    }
    
    const processedCodeTable = processedTables.fullWithSelection
    
    // 加載當量表
    const response = await fetch('/data/equivTable.json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const equivTableData = await response.json()
    const equivTable = equivTableData.data || {}
    
    // 加載各種字頻表
    const builtinService = new BuiltinCodeTableService()
    const [zhihuFreq, scFreq, tcFreq, unifiedFreq] = await Promise.all([
      builtinService.loadCharFrequency(),
      builtinService.loadCharFrequencySC(),
      builtinService.loadCharFrequencyTC(),
      builtinService.loadCharFrequencyUnified()
    ])
    
    // 計算各種字頻下的速度當量
    const zhihuEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, zhihuFreq, equivTable)
    const scEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, scFreq, equivTable)
    const tcEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, tcFreq, equivTable)
    const unifiedEquiv = calculateSpeedEquivFromCodeTable(processedCodeTable, unifiedFreq, equivTable)
    
    return {
      zhihuEquiv,
      scEquiv,
      tcEquiv,
      unifiedEquiv
    }
  } catch (error) {
    console.error('主方案速度當量計算失敗:', error)
    return {
      zhihuEquiv: 0,
      scEquiv: 0,
      tcEquiv: 0,
      unifiedEquiv: 0
    }
  }
}

// 獨立的碼表選重鍵處理函數（不依賴全局服務）
function generateCodeTableWithSelection(
  codeTable: CodeTable,
  maxLength: number, 
  isPrefix: boolean
): CodeTable {
  const result = new Map<string, string[]>()
  
  // 統計每個編碼的候選字符數量
  const codeToChars = new Map<string, string[]>()
  
  for (const [char, codes] of codeTable.entries()) {
    for (const code of codes) {
      let processedCode = code
      
      // 如果不是前綴碼且編碼長度小於最大長度，補充下劃線
      if (!isPrefix && code.length < maxLength) {
        processedCode = code + '_'.repeat(maxLength - code.length)
      }
      
      if (!codeToChars.has(processedCode)) {
        codeToChars.set(processedCode, [])
      }
      codeToChars.get(processedCode)!.push(char)
    }
  }
  
  // 為每個字符生成最終編碼（包含選重鍵）
  for (const [char, codes] of codeTable.entries()) {
    const processedCodes: string[] = []
    
    for (const code of codes) {
      let processedCode = code
      
      // 如果不是前綴碼且編碼長度小於最大長度，補充下劃線
      if (!isPrefix && code.length < maxLength) {
        processedCode = code + '_'.repeat(maxLength - code.length)
      }
      
      const candidates = codeToChars.get(processedCode) || []
      const charIndex = candidates.indexOf(char)
      
      // 添加選重鍵
      if (charIndex === 0) {
        // 第一候選，不加選重鍵
        processedCodes.push(processedCode)
      } else if (charIndex === 1) {
        // 第二候選，加分號
        processedCodes.push(processedCode + ';')
      } else if (charIndex === 2) {
        // 第三候選，加單引號
        processedCodes.push(processedCode + "'")
      } else {
        // 更多候選，使用數字鍵（簡化處理）
        processedCodes.push(processedCode + (charIndex + 1).toString())
      }
    }
    
    if (processedCodes.length > 0) {
      result.set(char, processedCodes)
    }
  }
  
  return result
}

// 已废弃：保留兼容性，但推荐使用分离的函数
async function calculateSchemeData(codeTable: CodeTable, isPrefix = false): Promise<SchemeData> {
  const [dynamic, static_] = await Promise.all([
    calculateDynamicData(codeTable, isPrefix),
    calculateStaticData(codeTable, isPrefix)
  ])
  
  return {
    dynamic,
    static: static_
  }
}

// 选择内置方案时自动添加
async function onBuiltinSchemeSelect() {
  if (selectedBuiltinScheme.value && !isAdding.value) {
    await addBuiltinScheme()
  }
}

// 添加內置方案
async function addBuiltinScheme() {
  if (!selectedBuiltinScheme.value || isAdding.value) return
  
  const builtinScheme = availableBuiltinSchemes.value.find(s => s.id === selectedBuiltinScheme.value)
  if (!builtinScheme) return

  isAdding.value = true
  
  try {
    // 獲取方案配置信息
    const schemeConfig = await builtinService.getBuiltinCodeTable(selectedBuiltinScheme.value)
    
    const newScheme: Scheme = {
      id: `builtin_${selectedBuiltinScheme.value}_${Date.now()}`,
      name: builtinScheme.name,
      isBuiltin: true,
      isCalculating: true,
      isPrefix: schemeConfig?.prefix || false,  // 從配置中獲取前綴碼屬性
      source: selectedBuiltinScheme.value, // 記錄內置方案ID
      uploadedAt: new Date() // 添加時間
    }
    
    additionalSchemes.value.push(newScheme)
    showAddForm.value = false
    
    // 載入碼表並計算當前Tab的數據
    const result = await builtinService.downloadCodeTable(selectedBuiltinScheme.value)
    newScheme.codeTable = result.codeTable
    
    // 只計算當前Tab需要的數據
    newScheme.data = {}
    if (activeTab.value === 'dynamic') {
      newScheme.data.dynamic = await calculateDynamicData(result.codeTable, newScheme.isPrefix)
    } else if (activeTab.value === 'static') {
      newScheme.data.static = await calculateStaticData(result.codeTable, newScheme.isPrefix)
    } else if (activeTab.value === 'maxCandidates') {
      newScheme.data.maxCandidates = await calculateMaxCandidatesData(result.codeTable, newScheme.isPrefix)
    } else if (activeTab.value === 'speedEquiv') {
      newScheme.data.speedEquiv = await calculateSpeedEquivData(result.codeTable, newScheme.isPrefix)
    }
    
    newScheme.isCalculating = false
    
    selectedBuiltinScheme.value = ''
    
    // 立即保存數據
    saveComparisonData()
    
  } catch (error) {
    console.error('添加內置方案失敗:', error)
    // 移除失敗的方案
    const index = additionalSchemes.value.findIndex(s => s.name === builtinScheme.name && s.isCalculating)
    if (index !== -1) {
      additionalSchemes.value.splice(index, 1)
    }
  } finally {
    isAdding.value = false
  }
}

// 添加所有內置方案
async function addAllBuiltinSchemes() {
  if (isAdding.value || availableBuiltinSchemes.value.length === 0) return
  
  isAdding.value = true
  
  try {
    // 獲取已添加的內置方案ID，避免重複添加
    const existingBuiltinIds = new Set(
      additionalSchemes.value
        .filter(scheme => scheme.isBuiltin)
        .map(scheme => scheme.id.split('_')[1])
    )
    
    // 過濾出尚未添加的方案
    const schemesToAdd = availableBuiltinSchemes.value.filter(
      scheme => !existingBuiltinIds.has(scheme.id)
    )
    
    if (schemesToAdd.length === 0) {
      console.log('所有內置方案都已添加')
      return
    }
    
    // 逐個添加方案
    for (const builtinScheme of schemesToAdd) {
      try {
        // 獲取方案配置信息
        const schemeConfig = await builtinService.getBuiltinCodeTable(builtinScheme.id)
        
        const newScheme: Scheme = {
          id: `builtin_${builtinScheme.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: builtinScheme.name,
          isBuiltin: true,
          isCalculating: true,
          isPrefix: schemeConfig?.prefix || false,  // 從配置中獲取前綴碼屬性
          source: builtinScheme.id, // 記錄內置方案ID
          uploadedAt: new Date() // 添加時間
        }
        
        additionalSchemes.value.push(newScheme)
        
        // 載入碼表並計算當前Tab的數據
        const result = await builtinService.downloadCodeTable(builtinScheme.id)
        newScheme.codeTable = result.codeTable
        
        // 只計算當前Tab需要的數據
        newScheme.data = {}
        if (activeTab.value === 'dynamic') {
          newScheme.data.dynamic = await calculateDynamicData(result.codeTable, newScheme.isPrefix)
        } else if (activeTab.value === 'static') {
          newScheme.data.static = await calculateStaticData(result.codeTable, newScheme.isPrefix)
        } else if (activeTab.value === 'maxCandidates') {
          newScheme.data.maxCandidates = await calculateMaxCandidatesData(result.codeTable, newScheme.isPrefix)
        } else if (activeTab.value === 'speedEquiv') {
          newScheme.data.speedEquiv = await calculateSpeedEquivData(result.codeTable, newScheme.isPrefix)
        }
        
        newScheme.isCalculating = false
        
      } catch (error) {
        console.error(`添加方案 ${builtinScheme.name} 失敗:`, error)
        // 移除失敗的方案
        const index = additionalSchemes.value.findIndex(s => s.name === builtinScheme.name && s.isCalculating)
        if (index !== -1) {
          additionalSchemes.value.splice(index, 1)
        }
      }
    }
    
    showAddForm.value = false
    selectedBuiltinScheme.value = ''
    
    // 立即保存數據
    saveComparisonData()
    
  } catch (error) {
    console.error('批量添加內置方案失敗:', error)
  } finally {
    isAdding.value = false
  }
}

// 觸發文件上傳
function triggerFileUpload(format: 'char_first' | 'code_first') {
  if (format === 'char_first') {
    fileInputCharCode.value?.click()
  } else {
    fileInputCodeChar.value?.click()
  }
}

// 處理文件上傳
async function handleFileUpload(event: Event, format: 'char_first' | 'code_first') {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || isAdding.value) return
  
  isAdding.value = true
  
  try {
    const newScheme: Scheme = {
      id: `upload_${Date.now()}`,
      name: file.name.replace(/\.(txt|csv)$/, ''),
      isBuiltin: false,
      isCalculating: true,
      isPrefix: uploadPrefixFlag.value,  // 使用上傳時的前綴碼設置
      source: file.name, // 記錄文件名
      uploadedAt: new Date() // 記錄上傳時間
    }
    
    additionalSchemes.value.push(newScheme)
    showAddForm.value = false
    
    // 解析碼表文件
    const text = await file.text()
    const codeTable = parseCodeTableText(text, format)
    
    newScheme.codeTable = codeTable
    
    // 只計算當前Tab需要的數據
    newScheme.data = {}
    if (activeTab.value === 'dynamic') {
      newScheme.data.dynamic = await calculateDynamicData(codeTable, newScheme.isPrefix)
    } else if (activeTab.value === 'static') {
      newScheme.data.static = await calculateStaticData(codeTable, newScheme.isPrefix)
    } else if (activeTab.value === 'maxCandidates') {
      newScheme.data.maxCandidates = await calculateMaxCandidatesData(codeTable, newScheme.isPrefix)
    } else if (activeTab.value === 'speedEquiv') {
      newScheme.data.speedEquiv = await calculateSpeedEquivData(codeTable, newScheme.isPrefix)
    }
    
    newScheme.isCalculating = false
    
    // 立即保存數據
    saveComparisonData()
    
  } catch (error) {
    console.error('上傳碼表失敗:', error)
    // 移除失敗的方案
    const index = additionalSchemes.value.findIndex(s => s.name === file.name.replace(/\.(txt|csv)$/, '') && s.isCalculating)
    if (index !== -1) {
      additionalSchemes.value.splice(index, 1)
    }
  } finally {
    isAdding.value = false
  }
  
  // 清空文件輸入
  target.value = ''
}

// 解析碼表文本
function parseCodeTableText(text: string, format: 'char_first' | 'code_first'): CodeTable {
  const codeTable = new Map<string, string[]>()
  const lines = text.split('\n')
  
  const isCharFirst = format === 'char_first'
  
  // 根據指定格式解析數據
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    
    const parts = trimmed.split(/\s+/)
    if (parts.length >= 2) {
      let char: string, code: string
      
      if (isCharFirst) {
        // char code 格式：漢字 編碼
        char = parts[0]
        code = parts[1]
      } else {
        // code char 格式：編碼 漢字
        code = parts[0]
        char = parts[1]
      }
      
      if (!codeTable.has(char)) {
        codeTable.set(char, [])
      }
      codeTable.get(char)!.push(code)
    }
  }
  
  return codeTable
}

// 移除方案
// 判斷是否可以移除方案
function canRemoveScheme(scheme: Scheme): boolean {
  // 如果是當前用戶方案，不能移除
  if (currentUserScheme.value && scheme.id === currentUserScheme.value.id) {
    return false
  }
  
  // 只有額外添加的方案才能移除
  return additionalSchemes.value.some(s => s.id === scheme.id)
}

// 移除方案
function removeScheme(scheme: Scheme) {
  if (!canRemoveScheme(scheme)) return
  
  // 在額外方案列表中查找並移除
  const additionalSchemeIndex = additionalSchemes.value.findIndex(s => s.id === scheme.id)
  
  if (additionalSchemeIndex !== -1) {
    additionalSchemes.value.splice(additionalSchemeIndex, 1)
    // 立即保存數據
    saveComparisonData()
  }
}

// 取消添加
function cancelAdd() {
  showAddForm.value = false
  selectedBuiltinScheme.value = ''
}

// 清除所有額外添加的方案
function clearAllSchemes() {
  if (additionalSchemes.value.length > 0) {
    additionalSchemes.value = []
    saveComparisonData()
  }
}
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

/* Tab 样式 */
.tabs-container {
  margin-bottom: var(--spacing-lg);
}

.tab-list {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: var(--spacing-md);
}

.recalculate-btn {
  background: #eff6ff;
  color: #2563eb;
  border: 2px solid #bfdbfe;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.recalculate-btn:hover:not(:disabled) {
  background: #dbeafe;
  border-color: #93c5fd;
}

.recalculate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tab-button {
  background: none;
  border: none;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

.tab-button:hover {
  color: #374151;
  background-color: #f9fafb;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background-color: #eff6ff;
}

.collapse-button svg.rotated {
  transform: rotate(180deg);
}

/* 原有样式 */
/* 空狀態樣式 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  color: #374151;
}

.empty-state p {
  margin: 0 0 24px 0;
  font-size: 0.875rem;
}

.primary-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* 對比表格樣式 */
.comparison-table-container {
  overflow-x: auto;
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.comparison-table {
  width: 100%;
  min-width: max-content; /* 内容所需的最小宽度 */
  border-collapse: collapse;
  font-size: 0.8rem;
  table-layout: auto; /* 允许浏览器自动调整列宽 */
}

.comparison-table th,
.comparison-table td {
  padding: 6px 4px;
  text-align: center;
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  line-height: 1.2;
  white-space: nowrap; /* 防止文字换行 */
  min-width: 0; /* 允许列宽压缩到最小 */
  max-width: none; /* 不限制最大宽度 */
}

.comparison-table th:last-child,
.comparison-table td:last-child {
  border-right: none;
}

.comparison-table thead tr:last-child th {
  border-bottom: 2px solid #d1d5db;
}

.comparison-table tbody tr:last-child td {
  border-bottom: none;
}

.scheme-name-header {
  background: #f9fafb;
  width: auto; /* 改为自动宽度 */
  min-width: 60px; /* 较小的最小宽度 */
  text-align: left !important;
  font-weight: 600;
  color: #374151;
}

.metric-header {
  background: #f9fafb;
  width: auto; /* 改为自动宽度 */
  min-width: 40px; /* 较小的最小宽度 */
  font-weight: 600;
  color: #374151;
}

/* 可排序的表頭樣式 */
.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.sortable:hover {
  background: #f3f4f6 !important;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.header-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.sort-arrow {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: bold;
  min-width: 12px;
  text-align: center;
}

.metric-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.metric-header-content span {
  font-size: 0.7rem;
  line-height: 1.1;
  text-align: center;
}

.metric-header-content small {
  font-size: 0.6rem;
  opacity: 0.7;
  font-weight: 400;
}

.actions-header {
  background: #f9fafb;
  width: 60px;
  min-width: 60px;
  font-weight: 600;
  color: #374151;
}

.scheme-row:hover {
  background: #f9fafb;
}

.scheme-name {
  text-align: left !important;
}

.scheme-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scheme-title {
  font-weight: 500;
  color: #374151;
}

.scheme-source {
  font-size: 0.75rem;
  color: #6b7280;
}

.metric-cell {
  font-family: var(--font-numeric);
  font-feature-settings: "tnum" 0; /* 禁用表格數字，使用比例數字 */
}

.calculating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #6b7280;
}

.mini-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.metric-value {
  font-weight: 600;
  color: #059669;
}

.remove-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
  font-size: 0.8rem;
}

.remove-btn:hover {
  background: #fef2f2;
}

.no-remove {
  color: #9ca3af;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

/* 添加方案按鈕 */
.add-scheme-section {
  text-align: center;
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.add-scheme-btn {
  background: #f3f4f6;
  color: #374151;
  border: 2px dashed #d1d5db;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.add-scheme-btn:hover:not(:disabled) {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.add-scheme-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-all-btn {
  background: #fef2f2;
  color: #dc2626;
  border: 2px solid #fecaca;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.clear-all-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

/* 添加表單覆蓋層 */
.add-form-overlay {
  position: fixed; /* 固定定位，相对于视口 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6); /* 更深的背景色 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999; /* 極高的z-index值確保在最上層 */
  backdrop-filter: blur(4px); /* 背景模糊效果 */
  animation: fadeIn 0.2s ease-out; /* 淡入動畫 */
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.add-form {
  background: white;
  border-radius: 16px; /* 更大的圆角 */
  width: 90%;
  max-width: 600px; /* 增大最大宽度 */
  max-height: 85vh; /* 调整最大高度 */
  overflow-y: auto;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(0, 0, 0, 0.05); /* 多层阴影效果 */
  transform: scale(1);
  animation: slideIn 0.3s ease-out; /* 滑入动画 */
  border: 1px solid rgba(255, 255, 255, 0.2); /* 微妙的边框 */
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #e5e7eb;
}

.form-header h4 {
  margin: 0;
  font-size: 1.25rem;
  color: #374151;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: #374151;
}

.form-content {
  padding: 25px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h5 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  color: #374151;
  font-weight: 600;
}

.section-desc {
  margin: 0 0 12px 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.builtin-options {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  width: 100%;
}

.builtin-options .scheme-select {
  flex: 1;
}

.upload-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.prefix-toggle-section {
  margin-bottom: 15px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.prefix-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
}

.prefix-checkbox {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 2px solid #d1d5db;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.prefix-checkbox:checked {
  background: #3b82f6;
  border-color: #3b82f6;
}

.prefix-label {
  font-weight: 500;
  color: #374151;
}

.prefix-desc {
  color: #6b7280;
  font-size: 0.8rem;
}

.scheme-select,
.file-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.add-btn,
.upload-btn,
.add-all-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.add-all-btn {
  background: #3b82f6;
}

.add-btn:hover:not(:disabled),
.upload-btn:hover:not(:disabled) {
  background: #059669;
}

.add-all-btn:hover:not(:disabled) {
  background: #2563eb;
}

.add-btn:disabled,
.upload-btn:disabled,
.add-all-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.form-divider {
  text-align: center;
  margin: 24px 0;
  position: relative;
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e5e7eb;
  z-index: 0;
}

.form-divider span {
  background: white;
  padding: 0 12px;
  position: relative;
  z-index: 1;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .comparison-table {
    font-size: 0.7rem;
  }
  
  .comparison-table th,
  .comparison-table td {
    padding: 4px 3px;
    line-height: 1.1;
  }
  
  .scheme-name-header {
    width: 90px;
    min-width: 90px;
  }
  
  .metric-header {
    width: 65px;
    min-width: 65px;
  }
  
  .metric-header-content span {
    font-size: 0.6rem;
  }
  
  .metric-header-content small {
    font-size: 0.5rem;
  }
  
  .sort-arrow {
    font-size: 0.7rem;
  }
  
  .header-title {
    gap: 2px;
  }
  
  .actions-header {
    width: 50px;
    min-width: 50px;
  }
  
  .add-form {
    width: 95%;
    margin: 20px;
  }
  
  .builtin-options,
  .upload-area {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
